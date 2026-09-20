import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { validMoney } from "../../utils/rewardModel";
import { useQuestDay } from "../../hooks/useQuestDay";
import Quest from "./Quest";
import "./Quest.css";
import { MAX_QUEST_FREQUENCY, isValidQuestFrequency } from "../../utils/inputValidation";

function QuestList({ quests, addQuest, removeQuest, toggleComplete, reorderQuests, updateQuestReward }) {
  const today = useQuestDay();
  const [questName, setQuestName] = useState("");
  const [questFrequency, setQuestFrequency] = useState(1);

  const [rewardAmount, setRewardAmount] = useState(1000);

  const [error, setError] = useState("");

  const handleAddQuest = () => {
    if (!questName.trim()) return;

    if (!isValidQuestFrequency(questFrequency)) {
      setError(`퀘스트 횟수는 1부터 ${MAX_QUEST_FREQUENCY}까지 정수로 입력해주세요.`);
      return;
    }
    if (!validMoney(rewardAmount)) { setError("1회 보상은 1원~1억 원의 정수로 입력해 주세요."); return; }
    setError("");
    if (addQuest(questName, Number(questFrequency), Number(rewardAmount)) === false) return;
    setQuestName("");
    setQuestFrequency(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddQuest();
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    if (source.index === destination.index) {
      return;
    }

    reorderQuests(source.index, destination.index);
  };

  return (
    <div className="quest-list">
      <h2>나의 퀘스트</h2>
      <p className="desktop-only quest-list-description">완료한 활동을 체크해 주세요. 순서는 드래그해서 바꿀 수 있어요.</p>
      {quests.length === 0 && <p className="desktop-only quest-empty">아직 등록된 퀘스트가 없어요. 첫 목표를 추가해 보세요.</p>}

      <p className="quest-daily-help">퀘스트마다 하루 한 번 완료할 수 있어요. 한국 시간 자정에 다시 시작하며, 오늘 기록만 취소할 수 있어요.</p>

      {/* 퀘스트 목록 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="quests">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {quests.map((quest, index) => (
                <Draggable key={quest.id} draggableId={quest.id} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`quest-sortable-item${snapshot.isDragging ? " is-dragging" : ""}`}
                      style={provided.draggableProps.style}
                    >
                      <Quest
                        today={today}
                        index={index}
                        quest={quest}
                        toggleComplete={toggleComplete}
                        removeQuest={removeQuest}
                        updateQuestReward={updateQuestReward}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

      {/* 새 퀘스트 추가 폼 */}
      <div className="add-quest">
        <label className="quest-name-label" htmlFor="quest-name-input">퀘스트 이름</label>
        <input
          id="quest-name-input"
          type="text"
          value={questName}
          onChange={(e) => setQuestName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="예: 책 20분 읽기"
        />
        <label className="quest-frequency-label" htmlFor="quest-frequency-input">월 목표 횟수 · 최대 30회</label>
        <input
          id="quest-frequency-input"
          type="number"
          value={questFrequency}
          onChange={(e) => { setQuestFrequency(e.target.value); setError(""); }}
          onKeyDown={handleKeyDown}
          aria-label="월 퀘스트 횟수"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "quest-frequency-help quest-frequency-error" : "quest-frequency-help"}
          step="1"
          min="1"
          max={MAX_QUEST_FREQUENCY}
        />
        <label htmlFor="quest-reward-input">1회 완료 보상 (원)</label>
        <input id="quest-reward-input" type="number" min="1" max="100000000" step="1" value={rewardAmount} onChange={e => { setRewardAmount(e.target.value); setError(""); }} onKeyDown={handleKeyDown} />
        <p id="quest-frequency-help" className="quest-input-help">월 목표를 1~{MAX_QUEST_FREQUENCY}회로 입력해 주세요. 하루에 한 번씩 기록하며, 2월은 실제 날짜 수(28일 또는 29일)만큼 완료할 수 있어요.</p>
        {error && <p id="quest-frequency-error" role="alert">{error}</p>}
        <button onClick={handleAddQuest}>퀘스트 추가</button>
      </div>
    </div>
  );
}

export default QuestList;
