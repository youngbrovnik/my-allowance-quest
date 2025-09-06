import React from "react";
import "./Quest.css";

function Quest({ index, quest, toggleComplete, removeQuest, allowance, totalQuests, dragHandleProps = {} }) {
  // 퀘스트별 획득 금액 계산 (저장된 값이 없으면 직접 계산)
  let earnedAmount = quest.earnedPerCompletion || 0;

  // earnedPerCompletion이 0이면 직접 계산
  if (earnedAmount === 0 && allowance > 0) {
    const currentQuestsCount = Math.max(totalQuests || 1, 1);
    const safeFrequency = Math.max(quest.frequency || 1, 1);

    // (용돈 ÷ 퀘스트 개수) ÷ 퀘스트 총 횟수
    const allocatedAmount = allowance / currentQuestsCount; // 퀘스트당 할당 금액
    earnedAmount = Math.floor(allocatedAmount / safeFrequency / 1000) * 1000; // 1000원 단위로 반올림
    earnedAmount = Math.max(earnedAmount, 1000); // 최소 1000원
  }

  const progressPercentage = (quest.completedTimes / quest.frequency) * 100;

  // 디버깅: quest 객체와 earnedPerCompletion 값 확인
  console.log(`Quest ${index} 렌더링:`, {
    questName: quest.name,
    earnedPerCompletion: quest.earnedPerCompletion,
    earnedAmount,
    allowance,
    totalQuests,
    quest,
  });

  return (
    <div className={`quest-card ${quest.completed ? "completed" : ""}`}>
      <div className="quest-header">
        <div className="drag-handle" title="드래그하여 순서 변경" {...dragHandleProps}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 6h2v2H8V6zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm6-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
          </svg>
        </div>
        <div className="quest-info">
          <h3 className="quest-name">{quest.name}</h3>
          <div className="quest-meta">
            <span className="quest-frequency">{quest.frequency}회/월</span>
            <span className="quest-earned">{earnedAmount.toLocaleString()}원</span>
          </div>
        </div>

        <div className="quest-actions">
          <button
            onClick={() => toggleComplete(index)}
            className={`complete-btn ${quest.completed ? "completed" : ""}`}
            disabled={quest.completed}
          >
            {quest.completed ? "✓ 완료" : "완료"}
          </button>
          <button onClick={() => removeQuest(index)} className="remove-btn" title="퀘스트 삭제">
            ×
          </button>
        </div>
      </div>

      <div className="quest-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="progress-text">
          <span className="completed-times">{quest.completedTimes}</span>
          <span className="separator">/</span>
          <span className="totalTimes">{quest.frequency}</span>
          <span className="progress-percentage">({Math.round(progressPercentage)}%)</span>
        </div>
      </div>
    </div>
  );
}

export default Quest;
