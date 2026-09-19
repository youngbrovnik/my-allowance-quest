import React, { useState, useEffect } from "react";
import "./Allowance.css";
import { isValidAllowance } from "../../utils/inputValidation";

function Allowance({ allowance, updateAllowance }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(allowance);

  const [error, setError] = useState("");

  // allowance prop이 변경될 때 inputValue 동기화
  useEffect(() => {
    setInputValue(allowance);
  }, [allowance]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    setError("");
  };

  const handleButtonClick = () => {
    if (isEditing) {
      if (!isValidAllowance(inputValue)) {
        setError("용돈은 0원 이상 정수로 입력해주세요.");
        return;
      }
      updateAllowance(Number(inputValue));
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
            min="0"
            step="1"
            aria-label="월 용돈"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "allowance-error" : undefined}
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
      {error && <p id="allowance-error" role="alert">{error}</p>}
      <button onClick={handleButtonClick} className="allowance-button">
        {isEditing ? "Set" : "Edit"}
      </button>
    </div>
  );
}

export default Allowance;
