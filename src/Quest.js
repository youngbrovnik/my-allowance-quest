import React from "react";

function Quest({ index, quest, toggleComplete, removeQuest }) {
  return (
    <li style={{ display: "flex", alignItems: "center", color: "white" }}>
      <input
        type="checkbox"
        checked={quest.completed}
        onChange={() => toggleComplete(index)}
        style={{ marginRight: "10px" }}
      />
      <span style={{ textDecoration: quest.completed ? "line-through" : "none", flexGrow: 1 }}>
        {quest.name} - {quest.frequency} times/month (Completed: {quest.completedTimes}/{quest.frequency})
      </span>
      <button
        onClick={() => removeQuest(index)}
        style={{
          marginLeft: "10px",
          backgroundColor: "white",
          color: "black",
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
