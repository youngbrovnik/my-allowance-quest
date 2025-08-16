import React, { useState } from "react";
import Quest from "./Quest";
import "./Quest.css";

function QuestList({ quests, addQuest, removeQuest, toggleComplete, allowance }) {
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

  return (
    <div className="quest-list">
      <h2>Quest List</h2>

      {/* 퀘스트 목록 */}
      <ul>
        {quests.map((quest, index) => (
          <Quest
            key={index}
            index={index}
            quest={quest}
            toggleComplete={toggleComplete}
            removeQuest={removeQuest}
            allowance={allowance}
            totalQuests={quests.length}
          />
        ))}
      </ul>

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
