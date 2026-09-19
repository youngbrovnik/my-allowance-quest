import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Quest from "./Quest";
import "./Quest.css";
import { getDaysInMonth, isValidQuestFrequency } from "../../utils/inputValidation";

function QuestList({ quests, addQuest, removeQuest, toggleComplete, reorderQuests, allowance }) {
  const [questName, setQuestName] = useState("");
  const [questFrequency, setQuestFrequency] = useState(1);

  const [error, setError] = useState("");
  const daysInMonth = getDaysInMonth();

  const handleAddQuest = () => {
    if (!questName.trim()) return;

    if (!isValidQuestFrequency(questFrequency)) {
      setError(`퀘스트 횟수는 1부터 ${getDaysInMonth()}까지 정수로 입력해주세요.`);
      return;
    }
    setError("");
    addQuest(questName, Number(questFrequency));
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
      <h2>Quest List</h2>
      <p className="desktop-only quest-list-description">완료한 활동을 체크해 주세요. 순서는 드래그해서 바꿀 수 있어요.</p>
      {quests.length === 0 && <p className="desktop-only quest-empty">아직 등록된 퀘스트가 없어요. 첫 목표를 추가해 보세요.</p>}

      {/* 퀘스트 목록 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="quests">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {quests.map((quest, index) => (
                <Draggable key={`quest-${index}-${quest.name}`} draggableId={`quest-${index}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                        transform: snapshot.isDragging
                          ? `${provided.draggableProps.style?.transform || ""} translateX(-100px)`
                          : provided.draggableProps.style?.transform,
                      }}
                    >
                      <Quest
                        index={index}
                        quest={quest}
                        toggleComplete={toggleComplete}
                        removeQuest={removeQuest}
                        allowance={allowance}
                        totalQuests={quests.length}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
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
        <label className="quest-frequency-label" htmlFor="quest-frequency-input">월 횟수</label>
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
          max={daysInMonth}
        />
        <p id="quest-frequency-help" className="quest-input-help">한 달에 실천할 횟수를 1~{daysInMonth}회로 입력해 주세요.</p>
        {error && <p id="quest-frequency-error" role="alert">{error}</p>}
        <button onClick={handleAddQuest}>퀘스트 추가</button>
      </div>
    </div>
  );
}

export default QuestList;
