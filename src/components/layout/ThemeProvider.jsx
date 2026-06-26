"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // Read theme from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      const timer = setTimeout(() => {
        setTheme(storedTheme);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Apply class to <html> on change + save to localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
