import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");

  // OS 테마 설정 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

    const handleChange = (e) => {
      setTheme(e.matches ? "light" : "dark");
    };

    // 초기 테마 설정
    setTheme(mediaQuery.matches ? "light" : "dark");

    // 테마 변경 감지
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // 테마 수동 전환
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
