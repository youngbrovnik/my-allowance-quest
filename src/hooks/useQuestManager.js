import { useState, useCallback, useRef } from 'react';
import { getQuestDay } from '../utils/questDate';
import { isValidQuestFrequency } from '../utils/inputValidation';
import { activeEntries, makeEntry, newRewardId, normalizeRewardData, validMoney } from '../utils/rewardModel';

export const useQuestManager = (saveDataToFirestore) => {
  const [data, setData] = useState(() => normalizeRewardData());
  const current = useRef(data);
  const [actionError, setActionError] = useState('');
  const loadData = useCallback(value => {
    const next = normalizeRewardData(value);
    current.current = next;
    setData(next);
    setActionError('');
  }, []);
  const commit = useCallback(next => {
    if (!next) return false;
    if (!Number.isSafeInteger(next.balance) || next.balance < 0 || !Number.isSafeInteger(next.earned)) {
      setActionError('잔액을 확인해 주세요. 이미 사용한 금액은 사용 기록을 먼저 취소해야 합니다.');
      return false;
    }
    const draft = { ...next, lastUpdated: new Date().toISOString() };
    current.current = draft;
    setData(draft);
    setActionError('');
    saveDataToFirestore(draft);
    return true;
  }, [saveDataToFirestore]);

  const addQuest = (name, frequency, rewardAmount) => {
    if (!name.trim() || !isValidQuestFrequency(frequency) || !validMoney(rewardAmount)) return false;
    const state = current.current;
    return commit({ ...state, quests: [...state.quests, { id: newRewardId(), name: name.trim(), frequency: Number(frequency), rewardAmount: Number(rewardAmount), completedTimes: 0, completed: false, lastCompletedDate: null }] });
  };
  const updateQuestReward = (id, value) => {
    if (!validMoney(value)) return false;
    const state = current.current;
    return commit({ ...state, quests: state.quests.map(q => q.id === id ? { ...q, rewardAmount: Number(value) } : q) });
  };
  // 삭제는 향후 할 일만 없애며, 이미 쌓인 보상과 완료 내역은 남깁니다.
  const removeQuest = id => {
    const state = current.current;
    return commit({ ...state, quests: state.quests.filter(q => q.id !== id) });
  };
  const toggleQuestComplete = (id, action = 'complete') => {
    const state = current.current;
    const quest = state.quests.find(q => q.id === id);
    if (!quest || !['complete', 'cancel'].includes(action)) return false;
    const today = getQuestDay();
    const doneToday = quest.lastCompletedDate === today;
    const cancel = action === 'cancel';
    if (cancel ? !doneToday : doneToday || quest.completedTimes >= quest.frequency) return false;
    const original = activeEntries(state.entries).find(e => e.type === 'earn' && e.questId === id && e.date === today);
    if (cancel && !original) {
      setActionError('이전 방식으로 작성된 기록은 적립 당시 금액을 확인할 수 없어 취소할 수 없습니다.');
      return false;
    }
    const amount = cancel ? original.amount : quest.rewardAmount;
    if (!validMoney(amount)) return false;
    const delta = cancel ? -amount : amount;
    const completedTimes = quest.completedTimes + (cancel ? -1 : 1);
    return commit({
      ...state, balance: state.balance + delta, earned: state.earned + delta,
      quests: state.quests.map(q => q.id === id ? { ...q, completedTimes, completed: completedTimes >= q.frequency, lastCompletedDate: cancel ? null : today } : q),
      entries: [...state.entries, makeEntry(cancel ? 'cancel' : 'earn', delta, quest.name, { questId: id, ...(cancel ? { reverses: original.id } : {}) })],
    });
  };
  const reorderQuests = (start, end) => {
    const state = current.current;
    if (!state.quests[start] || !state.quests[end]) return false;
    const quests = [...state.quests];
    const [quest] = quests.splice(start, 1);
    quests.splice(end, 0, quest);
    return commit({ ...state, quests });
  };
  const setRewardGoal = (name, amount) => {
    if (!name.trim() || !validMoney(amount)) return false;
    return commit({ ...current.current, rewardGoal: { name: name.trim(), amount: Number(amount) } });
  };
  const spendReward = () => {
    const state = current.current;
    const goal = state.rewardGoal;
    if (!goal) return false;
    if (state.balance < goal.amount) { setActionError('보상을 사용하기에는 아직 잔액이 부족해요.'); return false; }
    return commit({ ...state, balance: state.balance - goal.amount, spent: state.spent + goal.amount, rewardGoal: null,
      entries: [...state.entries, makeEntry('spend', -goal.amount, goal.name, { rewardGoal: { ...goal } })] });
  };
  const undoSpend = id => {
    const state = current.current;
    const entry = activeEntries(state.entries).find(e => e.id === id && e.type === 'spend');
    if (!entry) return false;
    return commit({ ...state, balance: state.balance - entry.amount, spent: state.spent + entry.amount,
      rewardGoal: state.rewardGoal || entry.rewardGoal || { name: entry.name, amount: -entry.amount },
      entries: [...state.entries, makeEntry('refund', -entry.amount, entry.name, { reverses: entry.id })] });
  };
  return { data, quests: data.quests, earned: data.earned, actionError, loadData, addQuest, updateQuestReward, removeQuest, toggleQuestComplete, reorderQuests, setRewardGoal, spendReward, undoSpend };
};
