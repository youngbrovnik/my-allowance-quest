import React, { useState, useEffect } from "react";
import "./App.css";
import Allowance from "./Allowance";
import QuestList from "./QuestList";

function App() {
  const [allowance, setAllowance] = useState(0);
  const [quests, setQuests] = useState([]);
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    const savedAllowance = localStorage.getItem("allowance");
    const savedQuests = localStorage.getItem("quests");
    const savedEarned = localStorage.getItem("earned");

    if (savedAllowance) {
      setAllowance(JSON.parse(savedAllowance));
      console.log("Loaded allowance from localStorage:", JSON.parse(savedAllowance));
    }
    if (savedQuests) {
      setQuests(JSON.parse(savedQuests));
      console.log("Loaded quests from localStorage:", JSON.parse(savedQuests));
    }
    if (savedEarned) {
      setEarned(JSON.parse(savedEarned));
      console.log("Loaded earned from localStorage:", JSON.parse(savedEarned));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("allowance", JSON.stringify(allowance));
    console.log("Saved allowance to localStorage:", allowance);
  }, [allowance]);

  useEffect(() => {
    localStorage.setItem("quests", JSON.stringify(quests));
    console.log("Saved quests to localStorage:", quests);
  }, [quests]);

  useEffect(() => {
    localStorage.setItem("earned", JSON.stringify(earned));
    console.log("Saved earned to localStorage:", earned);
  }, [earned]);

  const updateAllowance = (newAllowance) => {
    setAllowance(newAllowance);
    setEarned(0); // Allowance를 업데이트할 때 획득한 용돈을 초기화합니다.
    console.log("Allowance updated to:", newAllowance);
  };

  const updateQuests = (newQuests) => {
    setQuests(newQuests);
    console.log("Quests updated to:", newQuests);
  };

  const updateEarned = (amount) => {
    setEarned((prev) => prev + amount);
  };

  return (
    <div className="App">
      <header className="App-header">My Allowance Quest</header>
      <Allowance allowance={allowance} updateAllowance={updateAllowance} />
      <QuestList
        quests={quests}
        updateQuests={updateQuests}
        allowance={allowance}
        updateEarned={updateEarned}
        earned={earned}
      />
      <p>Total Earned: {earned}</p>
    </div>
  );
}

export default App;
