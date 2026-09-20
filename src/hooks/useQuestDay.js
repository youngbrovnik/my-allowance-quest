import { useEffect, useState } from "react";
import { getQuestDay, millisecondsUntilNextQuestDay } from "../utils/questDate";

export const useQuestDay = () => {
  const [day, setDay] = useState(() => getQuestDay());
  useEffect(() => {
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      setDay(getQuestDay());
      timer = setTimeout(refresh, millisecondsUntilNextQuestDay());
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return day;
};
