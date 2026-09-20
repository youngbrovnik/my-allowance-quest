import { getQuestMonth } from "./questDate";

// 빈 입력을 0으로 변환하지 않고, 정확하게 표현할 수 있는 정수만 허용합니다.
const isIntegerInput = (value) =>
  (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) &&
  Number.isSafeInteger(Number(value));

export const isValidAllowance = (value) => isIntegerInput(value) && Number(value) >= 0;

export const getDaysInMonth = (date = new Date()) => {
  const [year, month] = getQuestMonth(date).split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

export const isValidQuestFrequency = (value, date = new Date()) =>
  isIntegerInput(value) && Number(value) >= 1 && Number(value) <= getDaysInMonth(date);
