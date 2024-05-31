import React, { useState, useEffect } from "react";
import Quest from "./Quest";

function QuestList({ quests, updateQuests, allowance, updateEarned, earned }) {
  const [questName, setQuestName] = useState("");
  const [questFrequency, setQuestFrequency] = useState(1);
  const [weekCompleted, setWeekCompleted] = useState(0);

  useEffect(() => {
    const savedWeekCompleted = localStorage.getItem("weekCompleted");
    if (savedWeekCompleted) {
      setWeekCompleted(JSON.parse(savedWeekCompleted));
      console.log("Loaded weekCompleted from localStorage:", JSON.parse(savedWeekCompleted));
    }

    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() === 0) {
        const resetQuests = quests.map((quest) => ({
          ...quest,
          completed: false,
          completedTimes: 0,
        }));
        updateQuests(resetQuests);
        setWeekCompleted(0); // 새로운 주차 시작 시 초기화
      }
    }, 60000); // 매 분마다 체크

    return () => clearInterval(interval);
  }, [quests, updateQuests]);

  useEffect(() => {
    localStorage.setItem("weekCompleted", JSON.stringify(weekCompleted));
    console.log("Saved weekCompleted to localStorage:", weekCompleted);
  }, [weekCompleted]);

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
        const earnedAmount = Math.floor(allowance / 4 / quests.length / quest.frequency / 1000) * 1000;
        updateEarned(earnedAmount);

        return { ...quest, completed: isCompleted, completedTimes: newCompletedTimes };
      }
      return quest;
    });

    updateQuests(newQuests);

    // 모든 퀘스트가 완료되었는지 확인
    const allQuestsCompleted = newQuests.every((quest) => quest.completed);
    if (allQuestsCompleted && weekCompleted < 1) {
      const earnedForWeek = Math.floor(allowance / 4 / 1000) * 1000;
      updateEarned(earnedForWeek);
      setWeekCompleted(1); // 현재 주차에 대한 보상 완료 처리
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
        max="7"
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
