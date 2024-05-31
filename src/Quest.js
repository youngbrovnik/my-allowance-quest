import React from "react";

function Quest({ index, quest, toggleComplete, removeQuest }) {
  return (
    <li
      style={{ textDecoration: quest.completed ? "line-through" : "none", color: quest.completed ? "gray" : "black" }}
    >
      <input type="checkbox" checked={quest.completed} onChange={() => toggleComplete(index)} />
      <span>
        {quest.name} - {quest.frequency} times/week
      </span>
      <span>
        {" "}
        (Completed: {quest.completedTimes}/{quest.frequency})
      </span>
      <button
        onClick={() => removeQuest(index)}
        style={{
          marginLeft: "10px",
          backgroundColor: "red",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        X
      </button>
    </li>
  );
}

export default Quest;
