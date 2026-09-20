import { runTransaction, getDocs, getDocsFromServer } from 'firebase/firestore';
import { rolloverMonthlyData, loadMonthlyHistory, saveUserData } from './firestoreService';

jest.mock('../config/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  doc: (_, ...parts) => parts.join('/'),
  runTransaction: jest.fn(),
  collection: (_, ...parts) => parts.join("/"),
  query: (path, ...conditions) => ({ path, conditions }),
  where: (field, op, value) => ({ field, value }),
  getDocsFromServer: jest.fn(),
  getDocs: jest.fn(),
}));

const now = new Date(2026, 8, 10);
const userPath = 'users/user-a';
const historyPath = `${userPath}/history/2026-06`;
const original = () => ({
  allowance: 10000, earned: 5000, lastUpdated: new Date(2026, 5, 20).toISOString(),
  quests: [{ name: '책 읽기', frequency: 2, completedTimes: 1, completed: false, earnedPerCompletion: 5000 }],
});
let documents, failCommit, transactions;

beforeEach(() => {
  documents = new Map([[userPath, original()]]);
  failCommit = false;
  transactions = [];
  getDocsFromServer.mockReset();
  getDocsFromServer.mockImplementation(async ({ path, conditions }) => ({
    docs: [...documents.entries()]
      .filter(([key, data]) => key.startsWith(`${path}/`) && conditions.every(({ field, value }) => data[field] === value))
      .map(([ref]) => ({ ref })),
  }));
  runTransaction.mockImplementation(async (_, callback) => {
    const writes = new Map();
    const transaction = {
      get: jest.fn(async path => ({ exists: () => documents.has(path), data: () => documents.get(path) })),
      set: jest.fn((path, value) => { writes.set(path, value); }),
    };
    transactions.push(transaction);
    const result = await callback(transaction);
    if (failCommit) throw new Error('commit failed');
    writes.forEach((value, path) => documents.set(path, value));
    return result;
  });
});

test('6월 기록과 9월 초기화 데이터를 한 트랜잭션으로 저장한다', async () => {
  const result = await rolloverMonthlyData('user-a', now);
  expect(transactions).toHaveLength(1);
  expect(transactions[0].set).toHaveBeenCalledTimes(2);
  expect(documents.get(historyPath)).toMatchObject({ year: 2026, month: 6, totalEarned: 5000, quests: original().quests });
  expect(result).toMatchObject({ earned: 0, lastUpdated: now.toISOString(), quests: [{ ...original().quests[0], completedTimes: 0 }] });
  expect(documents.get(userPath)).toEqual(result);
});

test('커밋 실패 시 기록과 현재 데이터 모두 바뀌지 않고 재시도 시 한 번만 저장된다', async () => {
  failCommit = true;
  await expect(rolloverMonthlyData('user-a', now)).rejects.toThrow('commit failed');
  expect(documents.get(userPath)).toEqual(original());
  expect(documents.has(historyPath)).toBe(false);
  failCommit = false;
  await rolloverMonthlyData('user-a', now);
  await rolloverMonthlyData('user-a', now);
  expect(documents.size).toBe(2);
  expect(transactions[2].set).not.toHaveBeenCalled();
  expect(documents.get(historyPath).totalEarned).toBe(5000);
});

test('이미 있는 월 기록을 덮어쓰지 않는다', async () => {
  documents.set(historyPath, { totalEarned: 9000 });
  await rolloverMonthlyData('user-a', now);
  expect(documents.get(historyPath)).toEqual({ totalEarned: 9000 });
  expect(documents.get(userPath).earned).toBe(0);
});

test('다른 기기에서 월 전환과 편집을 끝냈으면 최신 데이터를 그대로 돌려준다', async () => {
  const latest = { ...original(), earned: 2000, lastUpdated: now.toISOString() };
  documents.set(userPath, latest);
  expect(await rolloverMonthlyData('user-a', now)).toEqual(latest);
  expect(transactions[0].set).not.toHaveBeenCalled();
});

test('해가 바뀌어도 전년도 기록으로 저장한다', async () => {
  documents.set(userPath, { ...original(), lastUpdated: new Date(2025, 11, 20).toISOString() });
  await rolloverMonthlyData('user-a', now);
  expect(documents.get(`${userPath}/history/2025-12`)).toMatchObject({ year: 2025, month: 12 });
});

test('퀘스트가 없어도 이미 획득한 보상은 기록하고 이월한다', async () => {
  documents.set(userPath, { ...original(), quests: [] });
  await rolloverMonthlyData('user-a', now);
  expect(documents.size).toBe(2);
  expect(documents.get(userPath)).toMatchObject({ quests: [], balance: 5000, earned: 0, lastUpdated: now.toISOString() });
});

test('손상된 퀘스트와 사용 기록도 정규화한 뒤 안전하게 월 전환한다', async () => {
  documents.set(userPath, {
    ...original(), schemaVersion: 2, quests: 'invalid', balance: 5000, spent: 1000,
    entries: [{ id: 'bad-spend', type: 'spend', amount: 1000, name: '잘못된 사용' }],
  });
  await expect(rolloverMonthlyData('user-a', now)).resolves.toMatchObject({ quests: [], balance: 5000, earned: 0, spent: 0, entries: [] });
  expect(documents.get(historyPath)).toMatchObject({ quests: [], entries: [], totalSpent: 1000, closingBalance: 5000 });
});

test.each([undefined, 'invalid', new Date(2027, 1, 1).toISOString()])('날짜 %s가 잘못되면 어떤 문서도 쓰지 않는다', async lastUpdated => {
  documents.set(userPath, { ...original(), lastUpdated });
  await expect(rolloverMonthlyData('user-a', now)).rejects.toThrow();
  expect(transactions[0].set).not.toHaveBeenCalled();
});

test('신규 사용자의 문서를 임의로 생성하지 않는다', async () => {
  documents.clear();
  expect(await rolloverMonthlyData('user-a', now)).toBeNull();
  expect(transactions[0].set).not.toHaveBeenCalled();
});

test('동시 실행 충돌로 콜백이 재실행되면 이미 초기화된 최신 진행 상황을 유지한다', async () => {
  const latest = { ...original(), earned: 2000, lastUpdated: now.toISOString() };
  const first = {
    get: jest.fn(async path => ({ exists: () => documents.has(path), data: () => documents.get(path) })),
    set: jest.fn(),
  };
  const retry = { ...first, set: jest.fn() };
  runTransaction.mockImplementationOnce(async (_, callback) => {
    await callback(first); // 이 시도의 쓰기는 충돌로 커밋하지 않습니다.
    documents.set(userPath, latest);
    documents.set(historyPath, { totalEarned: 5000 });
    return callback(retry);
  });
  expect(await rolloverMonthlyData('user-a', now)).toEqual(latest);
  expect(first.set).toHaveBeenCalledTimes(2);
  expect(retry.set).not.toHaveBeenCalled();
  expect(documents.get(historyPath)).toEqual({ totalEarned: 5000 });
});


test('히스토리 조회 실패는 빈 배열 대신 오류를 전달한다', async () => {
  const error = new Error('permission-denied');
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    getDocs.mockRejectedValueOnce(error);
    await expect(loadMonthlyHistory('user-a')).rejects.toBe(error);
  } finally { log.mockRestore(); }
});

test('조회에 성공하고 기록이 없을 때만 빈 배열을 반환한다', async () => {
  getDocs.mockResolvedValueOnce({ forEach: () => {} });
  await expect(loadMonthlyHistory('user-a')).resolves.toEqual([]);
});


test('재저장 시 원래 진행 날짜를 현재 날짜로 덮어쓰지 않는다', async () => {
  const data = original();
  await expect(saveUserData('user-a', data, original())).resolves.toBe(true);
  expect(transactions[0].set).toHaveBeenLastCalledWith(userPath, expect.objectContaining({ lastUpdated: data.lastUpdated }));
});

test('두 기기의 수정 중 뒤늦은 저장은 충돌로 반환하고 먼저 저장된 퀘스트를 보존한다', async () => {
  const baseA = original();
  const baseB = original();
  const added = { ...baseA, quests: [...baseA.quests, { name: '새 퀘스트' }] };
  await expect(saveUserData('user-a', added, baseA)).resolves.toBe(true);
  await expect(saveUserData('user-a', { ...baseB, allowance: 20000 }, baseB)).resolves.toEqual({ status: 'conflict' });
  expect(documents.get(userPath).quests).toEqual(added.quests);
  expect(documents.get(userPath).allowance).toBe(10000);
  expect(transactions[1].set).not.toHaveBeenCalled();
});

test('동시에 신규 문서를 만들더라도 먼저 생성한 기록을 덮어쓰지 않는다', async () => {
  documents.clear();
  await expect(saveUserData('user-a', original(), null)).resolves.toBe(true);
  await expect(saveUserData('user-a', { ...original(), allowance: 20000 }, null)).resolves.toEqual({ status: 'conflict' });
  expect(documents.get(userPath).allowance).toBe(10000);
});

test('최신 기준 데이터로 연속 저장하면 버전을 갱신하며 정상 저장한다', async () => {
  await saveUserData('user-a', { ...original(), allowance: 15000 }, original());
  const latest = documents.get(userPath);
  await expect(saveUserData('user-a', { ...latest, allowance: 16000 }, latest)).resolves.toBe(true);
  expect(documents.get(userPath)).toMatchObject({ allowance: 16000, revision: 2 });
});

test('월 전환 후 이전 달의 미저장 데이터는 현재 진행을 덮어쓰지 않는다', async () => {
  await rolloverMonthlyData('user-a', now);
  await expect(saveUserData('user-a', original(), original())).resolves.toEqual({ status: 'conflict' });
  expect(documents.get(userPath).earned).toBe(0);
});

test('13개월 이상의 기록도 기본 조회에서 잘리지 않는다', async () => {
  const records = Array.from({ length: 15 }, (_, i) => ({
    id: String(i), data: () => ({ createdAt: new Date(2025, i, 1).toISOString(), totalEarned: 1000 }),
  }));
  getDocs.mockResolvedValue({ forEach: callback => records.forEach(callback) });
  const history = await loadMonthlyHistory('user-a');
  expect(history).toHaveLength(15);
  expect(history[0].id).toBe('14');
  expect(history.reduce((sum, month) => sum + month.totalEarned, 0)).toBe(15000);
  expect(await loadMonthlyHistory('user-a', 12)).toHaveLength(12);
});


const legacyHistory = () => ({
  year: 2026, month: 6, allowance: 10000, totalEarned: 5000,
  quests: original().quests, createdAt: new Date(2026, 6, 1).toISOString(),
});

test('같은 내용의 구버전 기록이 있으면 새 기록을 만들지 않고 초기화만 한다', async () => {
  const legacyPath = `${userPath}/history/legacy-auto-id`;
  const legacy = legacyHistory();
  documents.set(legacyPath, legacy);
  await rolloverMonthlyData('user-a', now);
  expect(documents.has(historyPath)).toBe(false);
  expect(documents.get(legacyPath)).toEqual(legacy);
  expect(documents.get(userPath).earned).toBe(0);
  expect(transactions[0].set).toHaveBeenCalledTimes(1);
  await rolloverMonthlyData('user-a', now);
  expect(documents.size).toBe(2);
});

test.each([
  { totalEarned: 9000 },
  { allowance: 20000 },
  { quests: [{ ...original().quests[0], completedTimes: 2 }] },
])('같은 월의 구버전 기록 내용이 다르면 보존하고 초기화를 중단한다 (%s)', async difference => {
  const legacyPath = `${userPath}/history/legacy-auto-id`;
  const legacy = { ...legacyHistory(), ...difference };
  documents.set(legacyPath, legacy);
  await expect(rolloverMonthlyData('user-a', now)).rejects.toMatchObject({ code: 'history-conflict' });
  expect(documents.get(userPath)).toEqual(original());
  expect(documents.get(legacyPath)).toEqual(legacy);
  expect(documents.has(historyPath)).toBe(false);
  expect(transactions[0].set).not.toHaveBeenCalled();
});

test('다른 연도·월의 구버전 기록은 새 기록 생성을 막지 않는다', async () => {
  documents.set(`${userPath}/history/other-year`, { ...legacyHistory(), year: 2025 });
  documents.set(`${userPath}/history/other-month`, { ...legacyHistory(), month: 5 });
  await rolloverMonthlyData('user-a', now);
  expect(documents.get(historyPath)).toMatchObject({ year: 2026, month: 6 });
});

test('구버전 기록 조회 실패 시 초기화와 저장을 모두 중단한다', async () => {
  getDocsFromServer.mockRejectedValueOnce(new Error('unavailable'));
  await expect(rolloverMonthlyData('user-a', now)).rejects.toThrow('unavailable');
  expect(documents.get(userPath)).toEqual(original());
  expect(transactions[0].set).not.toHaveBeenCalled();
});

test('구버전 기록 확인 후 초기화 커밋이 실패해도 기존 기록과 진행을 보존한다', async () => {
  documents.set(`${userPath}/history/legacy-auto-id`, legacyHistory());
  failCommit = true;
  await expect(rolloverMonthlyData('user-a', now)).rejects.toThrow('commit failed');
  expect(documents.get(userPath)).toEqual(original());
  expect(documents.has(historyPath)).toBe(false);
});

test('후보 조회 뒤 삭제된 구버전 문서는 트랜잭션에서 재확인하여 새 기록을 저장한다', async () => {
  const ref = `${userPath}/history/deleted-legacy`;
  getDocsFromServer.mockResolvedValueOnce({ docs: [{ ref }] });
  await rolloverMonthlyData('user-a', now);
  expect(transactions[0].get).toHaveBeenCalledWith(ref);
  expect(documents.get(historyPath)).toMatchObject({ year: 2026, month: 6, totalEarned: 5000 });
});


test('두 기기의 같은 날짜 완료는 최신 revision 검사로 하나만 반영한다', async () => {
  const base = original();
  const draft = { ...base, earned: 10000, lastUpdated: '2026-06-20T10:00:00Z',
    quests: [{ ...base.quests[0], completedTimes: 2, completed: true, lastCompletedDate: '2026-06-20' }] };
  expect(await saveUserData('user-a', draft, base)).toBe(true);
  expect(await saveUserData('user-a', draft, base)).toEqual({ status: 'conflict' });
  expect(documents.get(userPath)).toMatchObject({ earned: 10000, revision: 1 });
  expect(documents.get(userPath).quests[0].completedTimes).toBe(2);
});

test('한국 자정 월 전환에서 지난달 날짜는 기록에 보존하고 새 달에서는 비운다', async () => {
  const data = { ...original(), lastUpdated: '2026-09-30T14:59:59Z',
    quests: [{ ...original().quests[0], lastCompletedDate: '2026-09-30' }] };
  documents.set(userPath, data);
  const result = await rolloverMonthlyData('user-a', new Date('2026-09-30T15:00:00Z'));
  expect(documents.get(`${userPath}/history/2026-09`).quests[0].lastCompletedDate).toBe('2026-09-30');
  expect(result.quests[0]).toMatchObject({ completedTimes: 0, lastCompletedDate: null });
});

test('새 보상 구조의 잔액과 목표는 이월하고 적립·사용 내역은 지난달에 보관한다', async () => {
  const entry = { id: 'earn-1', type: 'earn', amount: 2000, name: '운동', questId: 'q1', date: '2026-06-20' };
  const data = { ...original(), schemaVersion: 2, balance: 8000, earned: 2000, spent: 1000, rewardGoal: { name: '운동화', amount: 120000 },
    entries: [entry, { id: 'use-1', type: 'spend', amount: -1000, name: '간식', date: '2026-06-20' }], legacyCompletionCount: 0,
    quests: [{ id: 'q1', name: '운동', frequency: 12, completedTimes: 1, rewardAmount: 2000, lastCompletedDate: '2026-06-20' }] };
  documents.set(userPath, data);
  const result = await rolloverMonthlyData('user-a', now);
  expect(result).toMatchObject({ balance: 8000, earned: 0, spent: 0, entries: [], rewardGoal: data.rewardGoal });
  expect(result.quests[0]).toMatchObject({ rewardAmount: 2000, completedTimes: 0 });
  expect(documents.get(historyPath)).toMatchObject({ totalEarned: 2000, totalSpent: 1000, closingBalance: 8000, entries: data.entries, activeDays: 1 });
  await rolloverMonthlyData('user-a', now);
  expect(documents.get(userPath).balance).toBe(8000);
});

test('퀘스트를 모두 지운 달도 남아 있는 사용 내역을 보관한다', async () => {
  documents.set(userPath, { ...original(), schemaVersion: 2, quests: [], earned: 0, balance: 2000, spent: 1000, rewardGoal: null,
    entries: [{ id: 'use', type: 'spend', amount: -1000, name: '간식', date: '2026-06-20' }] });
  await rolloverMonthlyData('user-a', now);
  expect(documents.get(historyPath).totalSpent).toBe(1000);
  expect(documents.get(userPath).balance).toBe(2000);
});

test('새 구조를 이전 형식의 저장 요청으로 덮어쓸 수 없다', async () => {
  const base = { ...original(), schemaVersion: 2, balance: 5000 };
  documents.set(userPath, base);
  expect(await saveUserData('user-a', original(), base)).toEqual({ status: 'conflict' });
  expect(documents.get(userPath)).toEqual(base);
});

test('두 기기의 보상 사용도 한 번만 저장된다', async () => {
  const base = { ...original(), schemaVersion: 2, balance: 5000, spent: 0, rewardGoal: { name: '간식', amount: 1000 } };
  const draft = { ...base, balance: 4000, spent: 1000, rewardGoal: null, entries: [{ id: 'use', type: 'spend', amount: -1000 }] };
  documents.set(userPath, base);
  expect(await saveUserData('user-a', draft, base)).toBe(true);
  expect(await saveUserData('user-a', draft, base)).toEqual({ status: 'conflict' });
  expect(documents.get(userPath).balance).toBe(4000);
});
