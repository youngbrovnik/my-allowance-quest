import React, { useState, useEffect } from "react";
import "./Allowance.css";

function Allowance({ allowance, updateAllowance }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(allowance);

  // allowance prop이 변경될 때 inputValue 동기화
  useEffect(() => {
    setInputValue(allowance);
  }, [allowance]);

  const handleChange = (e) => {
    setInputValue(Number(e.target.value));
  };

  const handleButtonClick = () => {
    if (isEditing) {
      updateAllowance(inputValue);
    }
    setIsEditing(!isEditing);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleButtonClick();
    }
  };

  return (
    <div className="allowance-container">
      <h2>
        Allowance:{" "}
        {isEditing ? (
          <input
            type="number"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="allowance-input"
            placeholder="Enter your allowance"
          />
        ) : (
          allowance.toLocaleString()
        )}
      </h2>
      <button onClick={handleButtonClick} className="allowance-button">
        {isEditing ? "Set" : "Edit"}
      </button>
    </div>
  );
}

export default Allowance;
