import React, { useState, useEffect } from "react";

function Allowance({ allowance, updateAllowance }) {
  const [inputValue, setInputValue] = useState(allowance);

  useEffect(() => {
    console.log("Allowance component rendered");
    console.log("Current allowance:", allowance);
  }, [allowance]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateAllowance(Number(inputValue));
    console.log("Updated allowance:", Number(inputValue));
  };

  return (
    <div style={{ padding: "20px", border: "1px solid black" }}>
      <p>Set Your Allowance</p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="number"
          value={inputValue}
          onChange={handleChange}
          style={{ padding: "10px", fontSize: "16px" }}
          placeholder="Enter your allowance"
        />
        <button type="submit" style={{ padding: "10px", fontSize: "16px", backgroundColor: "blue", color: "white" }}>
          Update
        </button>
      </form>
      <p>Current Allowance: {allowance}</p>
    </div>
  );
}

export default Allowance;
