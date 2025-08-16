import { useState, useCallback } from "react";
import {
  calculateQuestEarnedAmount,
  recalculateAllQuestsEarnedAmount,
  calculateTotalEarned,
  isQuestCompleted,
  areAllQuestsCompleted,
} from "../utils/questCalculations";

/**
 * 퀘스트 관리를 위한 커스텀 훅
 */
export const useQuestManager = (allowance, saveDataToFirestore, saveMonthlyHistory) => {
  const [quests, setQuests] = useState([]);
  const [earned, setEarned] = useState(0);

  /**
   * 퀘스트 추가
   */
  const addQuest = useCallback(
    (questName, questFrequency) => {
      if (!questName.trim()) return;

      const currentQuestsCount = quests.length + 1;

      // 새 퀘스트 생성
      const newQuest = {
        name: questName.trim(),
        frequency: Number(questFrequency),
        completed: false,
        completedTimes: 0,
        earnedPerCompletion: calculateQuestEarnedAmount(allowance, currentQuestsCount, questFrequency),
      };

      // 모든 퀘스트의 earnedPerCompletion 재계산
      const allQuests = [...quests, newQuest];
      const updatedQuests = recalculateAllQuestsEarnedAmount(allQuests, allowance);

      // 번 돈 재계산
      const recalculatedEarned = calculateTotalEarned(updatedQuests, allowance);

      // 상태 업데이트
      setQuests(updatedQuests);
      setEarned(recalculatedEarned);

      // Firestore에 저장
      saveDataToFirestore({
        allowance,
        quests: updatedQuests,
        earned: recalculatedEarned,
        lastUpdated: new Date().toISOString(),
      });

      return updatedQuests;
    },
    [quests, allowance, saveDataToFirestore]
  );

  /**
   * 퀘스트 삭제
   */
  const removeQuest = useCallback(
    (index) => {
      const newQuests = quests.filter((_, i) => i !== index);

      // 남은 퀘스트들의 earnedPerCompletion 재계산
      const updatedQuests = recalculateAllQuestsEarnedAmount(newQuests, allowance);

      // 번 돈 재계산
      const recalculatedEarned = calculateTotalEarned(updatedQuests, allowance);

      // 상태 업데이트
      setQuests(updatedQuests);
      setEarned(recalculatedEarned);

      // Firestore에 저장
      saveDataToFirestore({
        allowance,
        quests: updatedQuests,
        earned: recalculatedEarned,
        lastUpdated: new Date().toISOString(),
      });

      return updatedQuests;
    },
    [quests, allowance, saveDataToFirestore]
  );

  /**
   * 퀘스트 완료 토글
   */
  const toggleQuestComplete = useCallback(
    (index) => {
      const newQuests = quests.map((quest, i) => {
        if (i === index) {
          const newCompletedTimes = quest.completedTimes + 1;
          const isCompleted = isQuestCompleted({ ...quest, completedTimes: newCompletedTimes });

          return {
            ...quest,
            completed: isCompleted,
            completedTimes: newCompletedTimes,
          };
        }
        return quest;
      });

      // 번 돈 재계산
      const totalEarned = calculateTotalEarned(newQuests, allowance);

      // 모든 퀘스트 완료 시 전체 용돈 획득
      let finalEarned = totalEarned;
      if (areAllQuestsCompleted(newQuests)) {
        finalEarned = allowance;
      }

      // 상태 업데이트
      setQuests(newQuests);
      setEarned(finalEarned);

      // Firestore에 저장
      saveDataToFirestore({
        allowance,
        quests: newQuests,
        earned: finalEarned,
        lastUpdated: new Date().toISOString(),
      });

      return { newQuests, finalEarned };
    },
    [quests, allowance, saveDataToFirestore]
  );

  /**
   * 용돈 변경 시 모든 퀘스트 재계산
   */
  const recalculateQuestsForNewAllowance = useCallback(
    (newAllowance) => {
      const updatedQuests = recalculateAllQuestsEarnedAmount(quests, newAllowance);
      const recalculatedEarned = calculateTotalEarned(updatedQuests, newAllowance);

      setQuests(updatedQuests);
      setEarned(recalculatedEarned);

      return { updatedQuests, recalculatedEarned };
    },
    [quests]
  );

  /**
   * 퀘스트 초기화 (월별 리셋 등) - 히스토리 저장 포함
   */
  const resetQuests = useCallback(async () => {
    // 현재 달의 완료 기록을 히스토리로 저장
    if (saveMonthlyHistory && quests.length > 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // 이전 달의 데이터를 저장하므로 monthName도 이전 달로 설정
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const monthHistory = {
        month: previousMonth + 1, // 1-12 (사용자 친화적)
        year: previousYear, // 2024
        allowance: allowance,
        quests: quests.map((quest) => ({
          name: quest.name,
          frequency: quest.frequency,
          completedTimes: quest.completedTimes,
          completed: quest.completed,
          earnedPerCompletion: quest.earnedPerCompletion,
        })),
        totalEarned: earned,
        completionRate: quests.filter((q) => q.completed).length / quests.length,
        completedQuests: quests.filter((q) => q.completed).length,
        totalQuests: quests.length,
        // createdAt을 이전 달의 마지막 날로 설정 (데이터의 실제 의미)
        createdAt: new Date(previousYear, previousMonth + 1, 0, 23, 59, 59).toISOString(),
      };

      await saveMonthlyHistory(monthHistory);
    }

    // 퀘스트 초기화
    const resetQuests = quests.map((quest) => ({
      ...quest,
      completed: false,
      completedTimes: 0,
    }));

    setQuests(resetQuests);
    setEarned(0);

    return resetQuests;
  }, [quests, allowance, earned, saveMonthlyHistory]);

  return {
    quests,
    earned,
    addQuest,
    removeQuest,
    toggleQuestComplete,
    recalculateQuestsForNewAllowance,
    resetQuests,
    setQuests,
    setEarned,
  };
};
