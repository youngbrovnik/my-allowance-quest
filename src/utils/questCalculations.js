/**
 * 퀘스트 관련 계산 유틸리티 함수들
 */

/**
 * 퀘스트당 할당 금액 계산
 * @param {number} allowance - 총 용돈
 * @param {number} questCount - 퀘스트 개수
 * @returns {number} 퀘스트당 할당 금액
 */
export const calculateAllocatedAmount = (allowance, questCount) => {
  const safeQuestCount = Math.max(questCount, 1);
  return allowance / safeQuestCount;
};

/**
 * 1회당 획득 금액 계산
 * @param {number} allocatedAmount - 퀘스트당 할당 금액
 * @param {number} frequency - 퀘스트 총 횟수
 * @returns {number} 1회당 획득 금액 (1000원 단위로 반올림)
 */
export const calculateEarnedPerCompletion = (allocatedAmount, frequency) => {
  const safeFrequency = Math.max(frequency, 1);
  const earnedPerCompletion = Math.floor(allocatedAmount / safeFrequency / 1000) * 1000;
  return Math.max(earnedPerCompletion, 1000); // 최소 1000원 보장
};

/**
 * 퀘스트의 earnedPerCompletion 계산
 * @param {number} allowance - 총 용돈
 * @param {number} questCount - 퀘스트 개수
 * @param {number} frequency - 퀘스트 총 횟수
 * @returns {number} 1회당 획득 금액
 */
export const calculateQuestEarnedAmount = (allowance, questCount, frequency) => {
  const allocatedAmount = calculateAllocatedAmount(allowance, questCount);
  return calculateEarnedPerCompletion(allocatedAmount, frequency);
};

/**
 * 총 획득 금액 계산
 * @param {Array} quests - 퀘스트 배열
 * @param {number} allowance - 총 용돈
 * @returns {number} 총 획득 금액
 */
export const calculateTotalEarned = (quests, allowance) => {
  let totalEarned = 0;

  quests.forEach((quest) => {
    if (quest.completedTimes > 0) {
      totalEarned += (quest.earnedPerCompletion || 0) * quest.completedTimes;
    }
  });

  // 용돈을 초과하면 용돈으로 제한
  return Math.min(totalEarned, allowance);
};

/**
 * 모든 퀘스트의 earnedPerCompletion 재계산
 * @param {Array} quests - 퀘스트 배열
 * @param {number} allowance - 총 용돈
 * @returns {Array} 업데이트된 퀘스트 배열
 */
export const recalculateAllQuestsEarnedAmount = (quests, allowance) => {
  const questCount = quests.length;

  return quests.map((quest) => {
    const newEarnedPerCompletion = calculateQuestEarnedAmount(allowance, questCount, quest.frequency);

    return {
      ...quest,
      earnedPerCompletion: newEarnedPerCompletion,
    };
  });
};

/**
 * 퀘스트 완료 상태 확인
 * @param {Object} quest - 퀘스트 객체
 * @returns {boolean} 완료 여부
 */
export const isQuestCompleted = (quest) => {
  return quest.completedTimes >= quest.frequency;
};

/**
 * 모든 퀘스트 완료 여부 확인
 * @param {Array} quests - 퀘스트 배열
 * @returns {boolean} 모든 퀘스트 완료 여부
 */
export const areAllQuestsCompleted = (quests) => {
  return quests.every(isQuestCompleted);
};
