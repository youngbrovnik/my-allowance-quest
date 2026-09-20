import { getQuestDay } from './questDate';
import { MAX_QUEST_FREQUENCY } from './inputValidation';

export const newRewardId = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const validMoney = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= 100000000;
export const activeEntries = (entries = []) => {
  const reversed = new Set(entries.filter(e => e.reverses).map(e => e.reverses));
  return entries.filter(e => !e.reverses && !reversed.has(e.id));
};

const nonNegativeInteger = (value, fallback = 0) => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : fallback;
const validDate = value => typeof value === 'string' && !Number.isNaN(Date.parse(value));
const validQuestDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const normalizeGoal = goal => goal && typeof goal === 'object' && typeof goal.name === 'string' && goal.name.trim() && validMoney(goal.amount)
  ? { name: goal.name.trim(), amount: Number(goal.amount) }
  : null;
const calculateLegacyRewardAmount = (allowance, questCount, frequency) => {
  const allocatedAmount = nonNegativeInteger(allowance) / Math.max(nonNegativeInteger(questCount), 1);
  return Math.max(Math.floor(allocatedAmount / Math.max(nonNegativeInteger(frequency), 1) / 1000) * 1000, 1000);
};
const normalizeQuest = (quest, index, original, questCount, legacy = false) => {
  const source = quest && typeof quest === 'object' ? quest : {};
  const frequency = Math.min(nonNegativeInteger(source.frequency, 1) || 1, MAX_QUEST_FREQUENCY);
  // 목표 조정으로 이미 완료한 실적이 줄어들지 않도록 보존합니다.
  const completedTimes = nonNegativeInteger(source.completedTimes);
  const fallbackReward = validMoney(source.earnedPerCompletion) ? Number(source.earnedPerCompletion) : calculateLegacyRewardAmount(original.allowance, questCount, source.frequency);
  return {
    ...source,
    id: typeof source.id === 'string' && source.id.trim() ? source.id : `${legacy ? 'legacy' : 'quest'}-${index}`,
    name: typeof source.name === 'string' && source.name.trim() ? source.name.trim() : '이름 없는 퀘스트',
    frequency,
    completedTimes,
    completed: completedTimes >= frequency,
    rewardAmount: validMoney(source.rewardAmount) ? Number(source.rewardAmount) : fallbackReward,
    lastCompletedDate: validQuestDate(source.lastCompletedDate) ? source.lastCompletedDate : null,
  };
};
const hasValidEntryAmount = (type, amount) => {
  if (!Number.isSafeInteger(amount) || amount === 0) return false;
  return ['opening', 'earn', 'refund'].includes(type) ? amount > 0 : amount < 0;
};
const normalizeEntry = (entry, index, fallbackDate) => {
  const amount = Number(entry?.amount);
  if (!entry || typeof entry !== 'object' || !['opening', 'earn', 'cancel', 'spend', 'refund'].includes(entry.type) || !hasValidEntryAmount(entry.type, amount)) return null;
  return {
    ...entry,
    id: typeof entry.id === 'string' && entry.id.trim() ? entry.id : `entry-${index}`,
    amount,
    name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : '기록',
    date: validQuestDate(entry.date) ? entry.date : null,
    createdAt: validDate(entry.createdAt) ? entry.createdAt : fallbackDate,
    ...(typeof entry.questId === 'string' ? { questId: entry.questId } : {}),
    ...(typeof entry.reverses === 'string' ? { reverses: entry.reverses } : {}),
    ...(entry.rewardGoal ? { rewardGoal: normalizeGoal(entry.rewardGoal) } : {}),
  };
};

// 구버전의 현재 획득액을 한 번만 가져옵니다. 과거 월 기록은 잔액에 더하지 않습니다.
export const normalizeRewardData = (data = null) => {
  const original = data && typeof data === 'object' ? data : {};
  const now = new Date().toISOString();
  const lastUpdated = validDate(original.lastUpdated) ? original.lastUpdated : now;
  const quests = Array.isArray(original.quests) ? original.quests : [];
  if (original.schemaVersion === 2) {
    return {
      ...original,
      schemaVersion: 2,
      quests: quests.map((quest, index) => normalizeQuest(quest, index, original, quests.length)),
      earned: nonNegativeInteger(original.earned),
      balance: nonNegativeInteger(original.balance),
      spent: nonNegativeInteger(original.spent),
      rewardGoal: normalizeGoal(original.rewardGoal),
      entries: (Array.isArray(original.entries) ? original.entries : []).map((entry, index) => normalizeEntry(entry, index, lastUpdated)).filter(Boolean),
      legacyCompletionCount: nonNegativeInteger(original.legacyCompletionCount),
      lastUpdated,
    };
  }
  const earned = nonNegativeInteger(original.earned);
  return {
    ...original,
    schemaVersion: 2,
    quests: quests.map((quest, index) => normalizeQuest(quest, index, original, quests.length, true)),
    earned,
    balance: earned,
    spent: 0,
    rewardGoal: null,
    entries: earned ? [{ id: 'legacy-opening', type: 'opening', amount: earned, name: '기존 획득 금액 이월', date: null, createdAt: lastUpdated }] : [],
    legacyCompletionCount: quests.reduce((sum, q) => sum + nonNegativeInteger(q?.completedTimes), 0),
    migratedFromLegacy: Boolean(data),
    lastUpdated,
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
