// 모든 기기에서 같은 날짜를 사용합니다. 한국은 일광 절약 시간을 사용하지 않습니다.
export const QUEST_TIME_ZONE = "Asia/Seoul";
const KOREA_OFFSET = 9 * 60 * 60 * 1000;
export const getQuestDay = (date = new Date()) => {
  const shifted = new Date(date.getTime() + KOREA_OFFSET);
  return Number.isNaN(shifted.getTime()) ? "" : shifted.toISOString().slice(0, 10);
};
export const getQuestMonth = (date = new Date()) => getQuestDay(date).slice(0, 7);
export const millisecondsUntilNextQuestDay = () => {
  const now = Date.now();
  return 86400000 - ((now + KOREA_OFFSET) % 86400000);
};
