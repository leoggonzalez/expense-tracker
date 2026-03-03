"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import {
  AppPreferences,
  defaultAppPreferences,
  EffectiveTheme,
  getSystemLocale,
  getSystemPrefersDarkMode,
  LanguagePreference,
  loadAppPreferences,
  resolveLanguagePreference,
  resolveThemePreference,
  saveAppPreferences,
  SupportedLocale,
  ThemePreference,
} from "@/lib/app_preferences";
import { setLocale } from "@/model/i18n";

type AppPreferencesContextValue = {
  themePreference: ThemePreference;
  effectiveTheme: EffectiveTheme;
  languagePreference: LanguagePreference;
  effectiveLanguage: SupportedLocale;
  setThemePreference: (value: ThemePreference) => void;
  setLanguagePreference: (value: LanguagePreference) => void;
};

type AppPreferencesProviderProps = {
  children: React.ReactNode;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(
  null,
);

export function AppPreferencesProvider({
  children,
}: AppPreferencesProviderProps): React.ReactElement {
  const [preferences, setPreferences] = useState<AppPreferences>(
    defaultAppPreferences,
  );
  const [systemPrefersDarkMode, setSystemPrefersDarkMode] = useState(false);
  const [systemLocale, setSystemLocale] = useState<SupportedLocale>("en");
  const effectiveTheme = resolveThemePreference(
    preferences.theme,
    systemPrefersDarkMode,
  );
  const effectiveLanguage = resolveLanguagePreference(
    preferences.language,
    systemLocale,
  );

  useEffect(() => {
    const nextPreferences = loadAppPreferences();
    setPreferences(nextPreferences);
    setSystemPrefersDarkMode(getSystemPrefersDarkMode());
    setSystemLocale(getSystemLocale());
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event: MediaQueryListEvent): void => {
      setSystemPrefersDarkMode(event.matches);
    };

    setSystemPrefersDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.lang = effectiveLanguage;
    setLocale(effectiveLanguage);
  }, [effectiveLanguage, effectiveTheme]);

  const setThemePreference = (value: ThemePreference): void => {
    setPreferences((currentPreferences) => {
      const nextPreferences = {
        ...currentPreferences,
        theme: value,
      };

      saveAppPreferences(nextPreferences);
      return nextPreferences;
    });
  };

  const setLanguagePreference = (value: LanguagePreference): void => {
    setPreferences((currentPreferences) => {
      const nextPreferences = {
        ...currentPreferences,
        language: value,
      };

      saveAppPreferences(nextPreferences);
      setSystemLocale(getSystemLocale());
      return nextPreferences;
    });
  };

  const contextValue: AppPreferencesContextValue = {
    themePreference: preferences.theme,
    effectiveTheme,
    languagePreference: preferences.language,
    effectiveLanguage,
    setThemePreference,
    setLanguagePreference,
  };

  return (
    <AppPreferencesContext.Provider value={contextValue}>
      <div key={`${effectiveTheme}-${effectiveLanguage}`}>{children}</div>
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferencesContextValue {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error(
      "useAppPreferences must be used within an AppPreferencesProvider",
    );
  }

  return context;
}
