import { calculateQuestEarnedAmount } from './questCalculations';
import { getQuestDay } from './questDate';

export const newRewardId = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const validMoney = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= 100000000;
export const activeEntries = (entries = []) => {
  const reversed = new Set(entries.filter(e => e.reverses).map(e => e.reverses));
  return entries.filter(e => !e.reverses && !reversed.has(e.id));
};

// 구버전의 현재 획득액을 한 번만 가져옵니다. 과거 월 기록은 잔액에 더하지 않습니다.
export const normalizeRewardData = (data = null) => {
  const original = data || {};
  if (original.schemaVersion === 2) return { ...original, entries: original.entries || [], rewardGoal: original.rewardGoal || null };
  const quests = original.quests || [];
  const earned = original.earned || 0;
  return {
    ...original,
    schemaVersion: 2,
    quests: quests.map((quest, index) => ({
      ...quest,
      id: quest.id || `legacy-${index}`,
      rewardAmount: quest.earnedPerCompletion || calculateQuestEarnedAmount(original.allowance || 0, quests.length, quest.frequency),
      lastCompletedDate: quest.lastCompletedDate || null,
    })),
    earned,
    balance: earned,
    spent: 0,
    rewardGoal: null,
    entries: earned ? [{ id: 'legacy-opening', type: 'opening', amount: earned, name: '기존 획득 금액 이월', date: null, createdAt: original.lastUpdated || new Date().toISOString() }] : [],
    legacyCompletionCount: quests.reduce((sum, q) => sum + (q.completedTimes || 0), 0),
    migratedFromLegacy: Boolean(data),
    lastUpdated: original.lastUpdated || new Date().toISOString(),
  };
};

export const periodStats = data => {
  const entries = activeEntries(data.entries);
  const completions = entries.filter(e => e.type === 'earn');
  const legacyCount = data.schemaVersion === 2 ? (data.legacyCompletionCount || 0) : (data.quests || []).reduce((sum, q) => sum + (q.completedTimes || 0), 0);
  return {
    completedCount: legacyCount + completions.length,
    activeDays: new Set(completions.map(e => e.date).filter(Boolean)).size,
    hasUnknownDays: legacyCount > 0,
    earned: data.totalEarned ?? data.earned ?? 0,
    spent: data.totalSpent ?? data.spent ?? 0,
  };
};
export const makeEntry = (type, amount, name, extra = {}) => ({
  id: newRewardId(), type, amount, name, date: getQuestDay(), createdAt: new Date().toISOString(), ...extra,
});
