import { useState, useCallback } from "react";
import { isValidQuestFrequency } from "../utils/inputValidation";
import {
  calculateQuestEarnedAmount,
  recalculateAllQuestsEarnedAmount,
  calculateTotalEarned,
  isQuestCompleted,
} from "../utils/questCalculations";

/**
 * 퀘스트 관리를 위한 커스텀 훅
 */
export const useQuestManager = (allowance, saveDataToFirestore) => {
  const [quests, setQuests] = useState([]);
  const [earned, setEarned] = useState(0);

  /**
   * 퀘스트 추가
   */
  const addQuest = useCallback(
    (questName, questFrequency) => {
      if (!questName.trim() || !isValidQuestFrequency(questFrequency)) return;

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

      // 공통 계산 함수에서 전체 완료 보상까지 계산합니다.
      const finalEarned = calculateTotalEarned(newQuests, allowance);

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
   * 퀘스트 순서 변경 (드래그 앤 드롭)
   */
  const reorderQuests = useCallback(
    (startIndex, endIndex) => {
      const result = Array.from(quests);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);

      // 순서가 변경되었으므로 earnedPerCompletion 재계산
      const updatedQuests = recalculateAllQuestsEarnedAmount(result, allowance);
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

  return {
    quests,
    earned,
    addQuest,
    removeQuest,
    toggleQuestComplete,
    recalculateQuestsForNewAllowance,
    reorderQuests,
    setQuests,
    setEarned,
  };
};
