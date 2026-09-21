import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';
import { loadUserData, saveUserData, rolloverMonthlyData } from '../../services/firestoreService';
import App from './App';

jest.mock('../../config/firebase', () => ({ auth: {} }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));
jest.mock('../../services/firestoreService', () => ({
  loadUserData: jest.fn(),
  saveUserData: jest.fn(),
  rolloverMonthlyData: jest.fn(),
}));

let authChanged;
const user = { uid: 'user-a', email: 'a@example.com' };
const storedData = () => ({
  allowance: 12000,
  schemaVersion: 2, balance: 3000, spent: 0, entries: [], legacyCompletionCount: 0,
  rewardGoal: { name: '운동화', amount: 12000 },
  quests: [],
  earned: 3000,
  lastUpdated: new Date().toISOString(),
});

beforeEach(() => {
  jest.resetAllMocks();
  window.matchMedia = jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
  onAuthStateChanged.mockImplementation((_, callback) => {
    authChanged = callback;
    return jest.fn();
  });
  saveUserData.mockResolvedValue(true);
});

async function login(account = user) {
  await act(async () => { authChanged(account); });
}

async function editGoal(value) {
  const edit = screen.queryByRole('button', { name: '보상 목표 수정' });
  if (edit) fireEvent.click(edit);
  fireEvent.change(screen.getByLabelText('보상 이름'), { target: { value: '운동화' } });
  fireEvent.change(screen.getByLabelText('목표 금액 (원)'), { target: { value } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '보상 목표 저장' })); });
  await waitFor(() => expect(saveUserData).toHaveBeenCalled());
}

test.each(['false', 'exception'])('불러오기 실패(%s) 시 편집을 막고 재시도 후 기존 데이터를 표시한다', async (failure) => {
  if (failure === 'false') loadUserData.mockResolvedValueOnce(false);
  else loadUserData.mockRejectedValueOnce(new Error('read failed'));
  loadUserData.mockResolvedValueOnce(storedData());
  render(<App />);
  await login();
  expect(screen.getByRole('alert')).toHaveTextContent('데이터를 불러오지 못했습니다');
  expect(screen.queryByRole('button', { name: '보상 목표 수정' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '퀘스트 추가' })).not.toBeInTheDocument();
  expect(saveUserData).not.toHaveBeenCalled();
  expect(rolloverMonthlyData).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));
  expect(await screen.findByText('목표 금액: 12,000원')).toBeInTheDocument();
  expect(screen.getByLabelText('사용 가능한 보상 3,000원')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await editGoal('15000');
  expect(saveUserData).toHaveBeenCalledWith(user.uid, expect.objectContaining({ rewardGoal: { name: '운동화', amount: 15000 } }), expect.any(Object));
});

test('불러오는 동안 편집과 자동 저장을 막는다', async () => {
  let resolve;
  loadUserData.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  render(<App />);
  await login();
  expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '보상 목표 수정' })).not.toBeInTheDocument();
  expect(saveUserData).not.toHaveBeenCalled();
  expect(rolloverMonthlyData).not.toHaveBeenCalled();
  await act(async () => { resolve(storedData()); });
  expect(screen.getByRole('button', { name: '보상 목표 수정' })).toBeInTheDocument();
});

test('문서가 없는 신규 사용자는 정상적으로 시작할 수 있다', async () => {
  loadUserData.mockResolvedValueOnce(null);
  render(<App />);
  await login();
  expect(screen.getByLabelText('사용 가능한 보상 0원')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await editGoal('10000');
  expect(saveUserData).toHaveBeenCalledWith(user.uid, expect.objectContaining({ rewardGoal: { name: '운동화', amount: 10000 }, quests: [] }), null);
});

test('저장 실패를 알리고 이후 저장 성공 시 안내를 해제한다', async () => {
  loadUserData.mockResolvedValueOnce(storedData());
  saveUserData.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  render(<App />);
  await login();
  await editGoal('15000');
  expect(await screen.findByRole('alert')).toHaveTextContent('변경 내용을 저장하지 못했습니다');
  expect(screen.getByText('목표 금액: 15,000원')).toBeInTheDocument();
  await editGoal('16000');
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});

test('계정 변경 전의 늦은 응답이 새 계정 데이터를 덮어쓰지 않는다', async () => {
  let resolveOld;
  loadUserData.mockImplementationOnce(() => new Promise((done) => { resolveOld = done; }));
  loadUserData.mockResolvedValueOnce(null);
  render(<App />);
  await login();
  await login({ uid: 'user-b', email: 'b@example.com' });
  await act(async () => { resolveOld(storedData()); });
  expect(screen.getByLabelText('사용 가능한 보상 0원')).toBeInTheDocument();
  await editGoal('20000');
  expect(saveUserData).toHaveBeenCalledWith('user-b', expect.objectContaining({ rewardGoal: { name: '운동화', amount: 20000 }, quests: [] }), null);
});


test('로그아웃 후 도착한 응답은 편집 화면을 다시 열지 않는다', async () => {
  let resolve;
  loadUserData.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  render(<App />);
  await login();
  await login(null);
  await act(async () => { resolve(storedData()); });
  expect(screen.getByRole('button', { name: /Google로 로그인/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '보상 목표 수정' })).not.toBeInTheDocument();
  expect(saveUserData).not.toHaveBeenCalled();
});

test('반복된 불러오기 실패에도 저장을 차단하고 재시도를 유지한다', async () => {
  loadUserData.mockResolvedValueOnce(false).mockResolvedValueOnce(false);
  render(<App />);
  await login();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));
  });
  expect(screen.getByRole('alert')).toHaveTextContent('기존 기록을 보호');
  expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '보상 목표 수정' })).not.toBeInTheDocument();
  expect(saveUserData).not.toHaveBeenCalled();
  expect(rolloverMonthlyData).not.toHaveBeenCalled();
});


test.each([
  [new Date(2026, 5, 20), new Date(2026, 8, 10), 2026, 6],
  [new Date(2025, 11, 20), new Date(2026, 2, 10), 2025, 12],
])("오랜만에 접속하면 마지막 저장일 %s의 월로 한 번 기록한다", async (savedAt, loginAt, year, month) => {
  jest.useFakeTimers();
  jest.setSystemTime(loginAt);
  try {
    const quests = [{ name: '책 읽기', frequency: 2, completedTimes: 1, completed: false, earnedPerCompletion: 5000 }];
    loadUserData.mockResolvedValueOnce({
      rewardGoal: { name: '운동화', amount: 10000 }, quests, earned: 5000, lastUpdated: savedAt.toISOString(),
    });
    rolloverMonthlyData.mockResolvedValueOnce({
      rewardGoal: { name: '운동화', amount: 10000 }, earned: 0, quests: [{ ...quests[0], completedTimes: 0 }],
      lastUpdated: loginAt.toISOString(),
    });
    render(<App />);
    await login();
    expect(rolloverMonthlyData).toHaveBeenCalledTimes(1);
    expect(rolloverMonthlyData).toHaveBeenCalledWith(user.uid, loginAt);
    expect(saveUserData).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/사용 가능한 보상/)).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});


const priorData = () => {
  const now = new Date();
  return { rewardGoal: { name: '운동화', amount: 10000 }, earned: 5000,
    quests: [{ name: '이전 계정 퀘스트', frequency: 2, completedTimes: 1, completed: false, earnedPerCompletion: 5000 }],
    lastUpdated: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString() };
};
const resetData = () => ({ ...priorData(), schemaVersion: 2, balance: 5000, spent: 0, entries: [], earned: 0,
  quests: priorData().quests.map((q, i) => ({ ...q, id: `legacy-${i}`, rewardAmount: q.earnedPerCompletion, completedTimes: 0 })), lastUpdated: new Date().toISOString() });

test.each(['success', 'failure'])('월 전환 중 계정 변경 후 이전 응답(%s)은 무시한다', async outcome => {
  let resolve, reject;
  rolloverMonthlyData.mockImplementationOnce(() => new Promise((yes, no) => { resolve = yes; reject = no; }));
  loadUserData.mockResolvedValueOnce(priorData()).mockResolvedValueOnce(null);
  render(<App />);
  await login();
  expect(screen.queryByRole('button', { name: '퀘스트 추가' })).not.toBeInTheDocument();
  await login({ uid: 'user-b', email: 'b@example.com' });
  await act(async () => { outcome === 'success' ? resolve(resetData()) : reject(new Error('failed')); });
  expect(screen.queryByText('이전 계정 퀘스트')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await editGoal('20000');
  expect(saveUserData).toHaveBeenLastCalledWith('user-b', expect.objectContaining({ quests: [] }), null);
});

test('월 전환 중에는 추가·완료·삭제·용돈 편집 화면을 열지 않는다', async () => {
  let finish;
  rolloverMonthlyData.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  loadUserData.mockResolvedValueOnce(priorData());
  render(<App />);
  await login();
  expect(screen.getByRole('status')).toHaveTextContent('월별 기록을 저장');
  expect(screen.queryByRole('button', { name: '퀘스트 추가' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '보상 목표 수정' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '완료' })).not.toBeInTheDocument();
  expect(saveUserData).not.toHaveBeenCalled();
  await act(async () => { finish(resetData()); });
  expect(screen.getByRole('button', { name: '퀘스트 추가' })).toBeInTheDocument();
  expect(screen.getByLabelText(/사용 가능한 보상/)).toBeInTheDocument();
});

test('월 전환 실패 시 편집을 막고 재시도 성공 후에만 초기화 결과를 표시한다', async () => {
  loadUserData.mockResolvedValue(priorData());
  rolloverMonthlyData.mockRejectedValueOnce(new Error('commit failed')).mockResolvedValueOnce(resetData());
  render(<App />);
  await login();
  expect(screen.getByRole('alert')).toHaveTextContent('월별 저장에 실패');
  expect(screen.queryByRole('button', { name: '퀘스트 추가' })).not.toBeInTheDocument();
  expect(saveUserData).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' })); });
  expect(screen.getByLabelText(/사용 가능한 보상/)).toBeInTheDocument();
  expect(rolloverMonthlyData).toHaveBeenCalledTimes(2);
});

test('월 전환 중 로그아웃하면 늦은 응답으로 화면이 복구되지 않는다', async () => {
  let finish;
  loadUserData.mockResolvedValueOnce(priorData());
  rolloverMonthlyData.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<App />);
  await login();
  await login(null);
  await act(async () => { finish(resetData()); });
  expect(screen.getByRole('button', { name: /Google로 로그인/ })).toBeInTheDocument();
  expect(screen.queryByText('이전 계정 퀘스트')).not.toBeInTheDocument();
  expect(saveUserData).not.toHaveBeenCalled();
});

test('월이 바뀐 직후 버튼을 눌러도 초기화 전에 편집을 저장하지 않는다', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 5, 30, 23, 59));
  let finish;
  try {
    const data = { ...storedData(), lastUpdated: new Date().toISOString() };
    loadUserData.mockResolvedValue(data);
    rolloverMonthlyData.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    render(<App />);
    await login();
    fireEvent.change(screen.getByLabelText('퀘스트 이름'), { target: { value: '새 퀘스트' } });
    jest.setSystemTime(new Date(2026, 6, 1));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '퀘스트 추가' })); });
    expect(saveUserData).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('월별 기록');
    await act(async () => { finish({ ...data, earned: 0, lastUpdated: new Date().toISOString() }); });
    expect(screen.getByRole('button', { name: '퀘스트 추가' })).toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});

test('진행 중인 저장이 끝난 뒤 월 전환을 위해 다시 불러온다', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 5, 30, 23, 59));
  let finishSave;
  try {
    const data = { ...storedData(), lastUpdated: new Date().toISOString() };
    loadUserData.mockResolvedValue(data);
    saveUserData.mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; }));
    rolloverMonthlyData.mockImplementation(async () => ({ ...data, rewardGoal: { name: '운동화', amount: 15000 }, earned: 0, lastUpdated: new Date().toISOString() }));
    render(<App />);
    await login();
    await editGoal('15000');
    await act(async () => { jest.advanceTimersByTime(60000); });
    expect(loadUserData).toHaveBeenCalledTimes(1);
    expect(rolloverMonthlyData).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '보상 목표 수정' })).not.toBeInTheDocument();
    await act(async () => { finishSave(true); });
    expect(loadUserData).toHaveBeenCalledTimes(2);
    expect(rolloverMonthlyData).toHaveBeenCalledTimes(1);
    expect(screen.getByText('목표 금액: 15,000원')).toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});

test('저장 실패 후 월이 바뀌어도 변경을 유지하고 원래 월로 재저장한 뒤 초기화한다', async () => {
  jest.useFakeTimers();
  const editedAt = new Date(2026, 5, 30, 23, 59);
  jest.setSystemTime(editedAt);
  try {
    let server = storedData();
    loadUserData.mockImplementation(async () => server);
    saveUserData.mockResolvedValueOnce(false).mockImplementation(async (_, data) => { server = data; return true; });
    rolloverMonthlyData.mockImplementation(async (_, date) => ({ ...server, earned: 0, lastUpdated: date.toISOString() }));
    render(<App />);
    await login();
    await editGoal('15000');
    await act(async () => { jest.advanceTimersByTime(60000); });
    expect(screen.getByText('목표 금액: 15,000원')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('월별 초기화를 보류');
    expect(loadUserData).toHaveBeenCalledTimes(1);
    expect(rolloverMonthlyData).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '다시 저장' })); });
    expect(saveUserData).toHaveBeenLastCalledWith(user.uid, expect.objectContaining({ rewardGoal: { name: '운동화', amount: 15000 }, lastUpdated: editedAt.toISOString() }), expect.any(Object));
    expect(rolloverMonthlyData).toHaveBeenCalledTimes(1);
    expect(screen.getByText('목표 금액: 15,000원')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});

test('월 전환 중 기다리던 저장이 실패해도 미저장 변경과 재시도 버튼을 복구한다', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 5, 30, 23, 59));
  let finish;
  try {
    loadUserData.mockResolvedValue(storedData());
    saveUserData.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    render(<App />);
    await login();
    await editGoal('15000');
    await act(async () => { jest.advanceTimersByTime(60000); });
    await act(async () => { finish(false); });
    expect(screen.getByText('목표 금액: 15,000원')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 저장' })).toBeInTheDocument();
    expect(loadUserData).toHaveBeenCalledTimes(1);
    expect(rolloverMonthlyData).not.toHaveBeenCalled();
  } finally { jest.useRealTimers(); }
});

test('재저장 중 상태를 표시하고 재실패해도 최신 변경을 보존한다', async () => {
  let finish;
  loadUserData.mockResolvedValue(storedData());
  saveUserData.mockResolvedValueOnce(false).mockResolvedValueOnce(false)
    .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<App />);
  await login();
  await editGoal('15000');
  await editGoal('16000');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '다시 저장' })); });
  expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled();
  expect(saveUserData).toHaveBeenLastCalledWith(user.uid, expect.objectContaining({ rewardGoal: { name: '운동화', amount: 16000 } }), expect.any(Object));
  await act(async () => { finish(false); });
  expect(screen.getByText('목표 금액: 16,000원')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다시 저장' })).toBeEnabled();
});

test('미저장 변경은 다른 계정에 섞이지 않고 원래 계정으로 돌아오면 복구된다', async () => {
  loadUserData.mockResolvedValueOnce(storedData()).mockResolvedValueOnce(null);
  saveUserData.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  render(<App />);
  await login();
  await editGoal('15000');
  await login({ uid: 'user-b', email: 'b@example.com' });
  expect(screen.getByLabelText('사용 가능한 보상 0원')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '다시 저장' })).not.toBeInTheDocument();
  await login();
  expect(screen.getByText('목표 금액: 15,000원')).toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '다시 저장' })); });
  expect(saveUserData).toHaveBeenLastCalledWith(user.uid, expect.objectContaining({ rewardGoal: { name: '운동화', amount: 15000 } }), expect.any(Object));
});

test('저장 충돌 시 내 변경을 유지하고 사용자가 선택한 뒤 최신 기록을 불러온다', async () => {
  loadUserData.mockResolvedValueOnce(storedData()).mockResolvedValueOnce({ ...storedData(), rewardGoal: { name: '운동화', amount: 22000 }, revision: 1 });
  saveUserData.mockResolvedValueOnce({ status: 'conflict' });
  render(<App />);
  await login();
  await editGoal('15000');
  expect(screen.getByRole('alert')).toHaveTextContent('다른 기기에서 기록이 변경');
  expect(screen.getByText('목표 금액: 15,000원')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '보상 목표 수정' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: '다시 저장' })).not.toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '내 변경을 버리고 최신 기록 불러오기' })); });
  expect(screen.getByText('목표 금액: 22,000원')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '보상 목표 수정' })).toBeEnabled();
  await editGoal('23000');
  expect(saveUserData).toHaveBeenLastCalledWith(user.uid, expect.objectContaining({ rewardGoal: { name: '운동화', amount: 23000 } }), expect.objectContaining({ rewardGoal: { name: '운동화', amount: 22000 }, revision: 1 }));
});

test('충돌 후 최신 기록 조회가 실패해도 원래 미저장 변경을 복구할 수 있다', async () => {
  loadUserData.mockResolvedValueOnce(storedData()).mockResolvedValueOnce(false);
  saveUserData.mockResolvedValueOnce({ status: 'conflict' });
  render(<App />);
  await login();
  await editGoal('15000');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '내 변경을 버리고 최신 기록 불러오기' })); });
  expect(screen.getByRole('alert')).toHaveTextContent('데이터를 불러오지 못했습니다');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' })); });
  expect(screen.getByText('목표 금액: 15,000원')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('다른 기기에서 기록이 변경');
});

test('빠르게 연속 수정해도 저장을 직렬화하고 직전 성공 버전을 사용한다', async () => {
  let finish;
  const initial = storedData();
  loadUserData.mockResolvedValueOnce(initial);
  saveUserData.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce(true);
  render(<App />);
  await login();
  await editGoal('15000');
  await editGoal('16000');
  expect(saveUserData).toHaveBeenCalledTimes(1);
  await act(async () => { finish(true); });
  expect(saveUserData).toHaveBeenCalledTimes(2);
  expect(saveUserData).toHaveBeenLastCalledWith(user.uid, expect.objectContaining({ rewardGoal: { name: '운동화', amount: 16000 } }), expect.objectContaining({ rewardGoal: { name: '운동화', amount: 15000 }, revision: 1 }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('구버전 월별 기록 내용이 다르면 초기화를 중단한 이유를 안내한다', async () => {
  loadUserData.mockResolvedValueOnce(priorData());
  rolloverMonthlyData.mockRejectedValueOnce(Object.assign(new Error('different history'), { code: 'history-conflict' }));
  render(<App />);
  await login();
  expect(screen.getByRole('alert')).toHaveTextContent('같은 달에 내용이 다른 기존 기록');
  expect(screen.queryByRole('button', { name: '퀘스트 추가' })).not.toBeInTheDocument();
  expect(saveUserData).not.toHaveBeenCalled();
});

test('로그인 전 샘플 체험은 계정에 저장되지 않고 로그인 후 기존 기록과 분리된다', async () => {
  render(<App />);
  await login(null);
  expect(screen.getByRole('heading', { name: /해야 할 일을 끝내고/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /로그인 없이 체험하기/ }));
  fireEvent.click(screen.getByRole('button', { name: '운동 20분 하기 완료' }));
  expect(screen.getByRole('status')).toHaveTextContent('3,000원');
  fireEvent.click(screen.getByRole('button', { name: '운동 20분 하기 완료 취소' }));
  expect(screen.getByRole('progressbar', { name: '샘플 보상 달성률' })).toHaveAttribute('value', '0');
  for (const name of ['운동 20분 하기', '책 20분 읽기', '방 정리하기']) {
    fireEvent.click(screen.getByRole('button', { name: `${name} 완료` }));
  }
  expect(screen.getByRole('status')).toHaveTextContent('목표 달성!');
  fireEvent.click(screen.getByRole('button', { name: '체험 초기화' }));
  expect(screen.getByRole('progressbar', { name: '샘플 보상 달성률' })).toHaveAttribute('value', '0');
  fireEvent.click(screen.getByRole('button', { name: '방 정리하기 완료' }));
  expect(loadUserData).not.toHaveBeenCalled();
  expect(saveUserData).not.toHaveBeenCalled();
  expect(rolloverMonthlyData).not.toHaveBeenCalled();
  loadUserData.mockResolvedValueOnce(storedData());
  await login();
  expect(screen.queryByRole('heading', { name: '오늘의 작은 퀘스트' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('사용 가능한 보상 3,000원')).toBeInTheDocument();
  expect(saveUserData).not.toHaveBeenCalled();
  await login(null);
  expect(screen.getByRole('progressbar', { name: '샘플 보상 달성률' })).toHaveAttribute('value', '0');
});


test('기존 기록에 오늘 완료·취소를 적용하고 재로그인해도 오늘의 중복 적립을 막는다', async () => {
  const initial = { ...storedData(), earned: 1000, balance: 1000, quests: [{ id: 'exercise', rewardAmount: 1000, name: '매일 운동', frequency: 12, completedTimes: 1, completed: false, earnedPerCompletion: 1000 }] };
  let server = initial;
  loadUserData.mockImplementation(async () => server);
  saveUserData.mockImplementation(async (_, data) => { server = data; return true; });
  render(<App />);
  await login();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '오늘 완료', exact: true })); });
  expect(screen.getByLabelText('사용 가능한 보상 2,000원')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '오늘 완료했어요 ✓' })).toBeDisabled();
  await login(null);
  await login();
  expect(screen.getByRole('button', { name: '오늘 완료했어요 ✓' })).toBeDisabled();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '오늘 기록 취소' })); });
  expect(screen.getByLabelText('사용 가능한 보상 1,000원')).toBeInTheDocument();
  expect(server.quests[0].completedTimes).toBe(1);
});

test('고정 보상 적립 후 목표 사용과 사용 취소가 잔액에 반영된다', async () => {
  loadUserData.mockResolvedValueOnce(null);
  render(<App />); await login();
  fireEvent.change(screen.getByLabelText('퀘스트 이름'), { target: { value: '운동' } });
  fireEvent.change(screen.getByLabelText('월 퀘스트 횟수'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('1회 완료 보상 (원)'), { target: { value: '3000' } });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '퀘스트 추가' })));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '오늘 완료' })));
  await editGoal('2000');
  fireEvent.click(screen.getByRole('button', { name: '보상 사용 기록' }));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '사용했어요' })));
  expect(screen.getByLabelText('사용 가능한 보상 1,000원')).toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '사용 기록 취소' })));
  expect(screen.getByLabelText('사용 가능한 보상 3,000원')).toBeInTheDocument();
  expect(saveUserData).toHaveBeenLastCalledWith(user.uid, expect.objectContaining({ balance: 3000, earned: 3000, spent: 0 }), expect.any(Object));
});
