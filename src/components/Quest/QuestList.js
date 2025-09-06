import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Quest from "./Quest";
import "./Quest.css";

function QuestList({ quests, addQuest, removeQuest, toggleComplete, reorderQuests, allowance }) {
  const [questName, setQuestName] = useState("");
  const [questFrequency, setQuestFrequency] = useState(1);

  // 현재 달의 총 일수를 계산하는 함수
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 현재 달의 총 일수
  const daysInMonth = getDaysInMonth(new Date().getFullYear(), new Date().getMonth());

  const handleAddQuest = () => {
    if (!questName.trim()) return;

    addQuest(questName, questFrequency);
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
        <input
          type="text"
          value={questName}
          onChange={(e) => setQuestName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quest Name"
        />
        <input
          type="number"
          value={questFrequency}
          onChange={(e) => setQuestFrequency(Number(e.target.value))}
          onKeyDown={handleKeyDown}
          min="1"
          max={daysInMonth}
        />
        <button onClick={handleAddQuest}>Add Quest</button>
      </div>
    </div>
  );
}

export default QuestList;
