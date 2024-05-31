import React, { useState } from "react";
import "./App.css";

function Allowance({ allowance, updateAllowance }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(allowance);

  const handleChange = (e) => {
    setInputValue(Number(e.target.value));
  };

  const handleButtonClick = () => {
    if (isEditing) {
      updateAllowance(inputValue);
    }
    setIsEditing(!isEditing);
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
