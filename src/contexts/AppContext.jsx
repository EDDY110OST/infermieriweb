import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import translations from "../translations";

const AppSettingsContext = createContext(null);

const getNestedTranslation = (lang, key) => {
  return key.split(".").reduce((obj, part) => (obj && obj[part] !== undefined ? obj[part] : undefined), translations[lang]);
};

export function AppSettingsProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "it";
    return localStorage.getItem("siteLang") || "it";
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("siteTheme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    // Title, description e canonical arrivano già corretti dall'HTML statico:
    // qui si aggiornano solo lingua del documento e tema.
    document.documentElement.lang = translations[language].locale;

    if (theme === "dark") {
      document.documentElement.classList.add("dark-theme");
    } else {
      document.documentElement.classList.remove("dark-theme");
    }
  }, [language, theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("siteLang", language);
    localStorage.setItem("siteTheme", theme);
  }, [language, theme]);

  const t = useCallback((key) => {
    const value = getNestedTranslation(language, key);
    return value !== undefined ? value : key;
  }, [language]);

  const switchLanguage = useCallback((nextLang) => {
    setLanguage(nextLang);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({
      language,
      theme,
      t,
      switchLanguage,
      toggleTheme
    }),
    [language, theme, t, switchLanguage, toggleTheme]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }
  return context;
}
