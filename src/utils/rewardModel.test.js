import { normalizeRewardData, periodStats } from './rewardModel';

test('손상된 최신 저장 데이터는 안전한 기본값으로 복구한다', () => {
  const normalized = normalizeRewardData({ schemaVersion: 2, quests: null, entries: 'invalid', balance: 'invalid', earned: -1, spent: 1.5, rewardGoal: { name: '', amount: 1000 }, legacyCompletionCount: -1, lastUpdated: 'invalid' });
  expect(normalized).toMatchObject({ quests: [], entries: [], balance: 0, earned: 0, spent: 0, rewardGoal: null, legacyCompletionCount: 0 });
  expect(() => periodStats(normalized)).not.toThrow();
});

test('부분적으로 손상된 퀘스트와 기록만 보정한다', () => {
  const normalized = normalizeRewardData({
    schemaVersion: 2, balance: 3000, earned: 3000, spent: 0,
    quests: [{ name: ' 운동 ', frequency: 3, completedTimes: 9, rewardAmount: '2000', lastCompletedDate: 'bad' }],
    entries: [{ type: 'earn', amount: '2000', name: ' 운동 ', date: '2026-09-20', createdAt: 'bad' }, { type: 'unknown', amount: 1000 }],
    rewardGoal: { name: ' 책 ', amount: '5000' }, lastUpdated: '2026-09-20T00:00:00.000Z',
  });
  expect(normalized.quests[0]).toMatchObject({ id: 'quest-0', name: '운동', frequency: 3, completedTimes: 9, completed: true, rewardAmount: 2000, lastCompletedDate: null });
  expect(normalized.entries).toHaveLength(1);
  expect(normalized.entries[0]).toMatchObject({ id: 'entry-0', amount: 2000, name: '운동', createdAt: normalized.lastUpdated });
  expect(normalized.rewardGoal).toEqual({ name: '책', amount: 5000 });
});

test.each([undefined, 2])('기존 31회 목표는 30회로 조정하고 실적과 보상은 보존한다 (버전 %s)', schemaVersion => {
  const data = normalizeRewardData({ schemaVersion, earned: 31000, balance: 31000, quests: [{ name: '독서', frequency: 31, completedTimes: 31, rewardAmount: 1000 }] });
  expect(data.quests[0]).toMatchObject({ frequency: 30, completedTimes: 31, rewardAmount: 1000, completed: true });
  expect(data.balance).toBe(31000);
});

test('기록 종류와 금액 방향이 맞지 않는 손상된 기록은 제거한다', () => {
  const entries = [
    { id: 'valid-spend', type: 'spend', amount: -1000, name: '간식' },
    { id: 'positive-spend', type: 'spend', amount: 1000, name: '잘못된 사용' },
    { id: 'negative-earn', type: 'earn', amount: -1000, name: '잘못된 적립' },
    { id: 'zero-refund', type: 'refund', amount: 0, name: '잘못된 취소' },
  ];
  const normalized = normalizeRewardData({ schemaVersion: 2, entries });
  expect(normalized.entries).toEqual([expect.objectContaining({ id: 'valid-spend', amount: -1000 })]);
});
