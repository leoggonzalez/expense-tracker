import { PersistedValue } from "@/lib/persisted_value";

export type ThemePreference = "system" | "light" | "dark";
export type EffectiveTheme = "light" | "dark";
export type LanguagePreference = "system" | "en" | "es" | "pt-BR";
export type SupportedLocale = "en" | "es" | "pt-BR";

export type AppPreferences = {
  theme: ThemePreference;
  language: LanguagePreference;
};

const APP_PREFERENCES_KEY = "expense_tracker_app_preferences";

const preferencesValue = new PersistedValue<AppPreferences>(
  APP_PREFERENCES_KEY,
  "local",
);

export const defaultAppPreferences: AppPreferences = {
  theme: "system",
  language: "system",
};

export function loadAppPreferences(): AppPreferences {
  const preferences = preferencesValue.load();

  if (!preferences) {
    return defaultAppPreferences;
  }

  return {
    theme: preferences.theme || defaultAppPreferences.theme,
    language: preferences.language || defaultAppPreferences.language,
  };
}

export function saveAppPreferences(preferences: AppPreferences): void {
  preferencesValue.save(preferences);
}

export function resolveThemePreference(
  preference: ThemePreference,
  prefersDarkMode: boolean,
): EffectiveTheme {
  if (preference === "system") {
    return prefersDarkMode ? "dark" : "light";
  }

  return preference;
}

export function getSystemPrefersDarkMode(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getSupportedLocale(input: string): SupportedLocale {
  const normalizedLocale = input.toLowerCase();

  if (normalizedLocale === "es" || normalizedLocale.startsWith("es-")) {
    return "es";
  }

  if (normalizedLocale === "pt" || normalizedLocale.startsWith("pt-")) {
    return "pt-BR";
  }

  return "en";
}

export function getSystemLocale(): SupportedLocale {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return getSupportedLocale(navigator.language);
}

export function resolveLanguagePreference(
  preference: LanguagePreference,
  systemLocale: SupportedLocale,
): SupportedLocale {
  return preference === "system" ? systemLocale : preference;
}
