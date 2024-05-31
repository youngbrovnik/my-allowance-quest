import React, { useState, useEffect } from "react";
import Quest from "./Quest";

function QuestList({ quests, updateQuests, allowance, updateEarned, earned, setEarned }) {
  const [questName, setQuestName] = useState("");
  const [questFrequency, setQuestFrequency] = useState(1);

  // 현재 달의 총 일수를 계산하는 함수
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 현재 달의 총 일수
  const daysInMonth = getDaysInMonth(new Date().getFullYear(), new Date().getMonth());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
        const resetQuests = quests.map((quest) => ({
          ...quest,
          completed: false,
          completedTimes: 0,
        }));
        updateQuests(resetQuests);
      }
    }, 60000); // 매 분마다 체크

    return () => clearInterval(interval);
  }, [quests, updateQuests]);

  const addQuest = () => {
    const newQuest = { name: questName, frequency: Number(questFrequency), completed: false, completedTimes: 0 };
    updateQuests([...quests, newQuest]);
    setQuestName("");
    setQuestFrequency(1);
  };

  const toggleComplete = (index) => {
    const newQuests = quests.map((quest, i) => {
      if (i === index) {
        const newCompletedTimes = quest.completedTimes + 1;
        const isCompleted = newCompletedTimes >= quest.frequency;

        // 각 퀘스트 수행 시 획득 금액 계산
        const earnedAmount = Math.floor(allowance / quests.length / quest.frequency / 1000) * 1000;
        updateEarned(earnedAmount);

        return { ...quest, completed: isCompleted, completedTimes: newCompletedTimes };
      }
      return quest;
    });

    updateQuests(newQuests);

    // 모든 퀘스트가 완료되었는지 확인
    const allQuestsCompleted = newQuests.every((quest) => quest.completed);
    if (allQuestsCompleted) {
      setEarned(allowance);
    }
  };

  const removeQuest = (index) => {
    const newQuests = quests.filter((_, i) => i !== index);
    updateQuests(newQuests);
  };

  return (
    <div className="quest-list">
      <h2>Quest List</h2>
      <input type="text" value={questName} onChange={(e) => setQuestName(e.target.value)} placeholder="Quest Name" />
      <input
        type="number"
        value={questFrequency}
        onChange={(e) => setQuestFrequency(Number(e.target.value))}
        min="1"
        max={daysInMonth}
      />
      <button onClick={addQuest}>Add Quest</button>
      <ul>
        {quests.map((quest, index) => (
          <Quest key={index} index={index} quest={quest} toggleComplete={toggleComplete} removeQuest={removeQuest} />
        ))}
      </ul>
    </div>
  );
}

export default QuestList;
