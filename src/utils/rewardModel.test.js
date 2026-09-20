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
  expect(normalized.quests[0]).toMatchObject({ id: 'quest-0', name: '운동', frequency: 3, completedTimes: 3, completed: true, rewardAmount: 2000, lastCompletedDate: null });
  expect(normalized.entries).toHaveLength(1);
  expect(normalized.entries[0]).toMatchObject({ id: 'entry-0', amount: 2000, name: '운동', createdAt: normalized.lastUpdated });
  expect(normalized.rewardGoal).toEqual({ name: '책', amount: 5000 });
});
