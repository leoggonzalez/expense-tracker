"use client";

import { Container, Hero, Select, useAppPreferences } from "@/components";
import { LanguagePreference, ThemePreference } from "@/lib/app_preferences";
import { Card, Stack, Text } from "@/elements";

import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default function Page(): React.ReactElement {
  const {
    languagePreference,
    setLanguagePreference,
    setThemePreference,
    themePreference,
  } = useAppPreferences();

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="settings"
          title={String(i18n.t("settings_page.title"))}
          pattern="settings"
        >
          <Text as="p" size="sm" color="hero-muted">
            {i18n.t("settings_page.subtitle")}
          </Text>
        </Hero>

        <Card
          padding={24}
          title={String(i18n.t("settings_page.appearance"))}
          icon="settings"
        >
          <Stack gap={20}>
            <Text as="p" size="sm" color="secondary">
              {i18n.t("settings_page.appearance_hint")}
            </Text>

            <Select
              label={i18n.t("settings_page.theme")}
              value={themePreference}
              onChange={(value) => setThemePreference(value as ThemePreference)}
              options={[
                {
                  value: "system",
                  label: i18n.t("settings_page.theme_system"),
                },
                {
                  value: "light",
                  label: i18n.t("settings_page.theme_light"),
                },
                {
                  value: "dark",
                  label: i18n.t("settings_page.theme_dark"),
                },
              ]}
            />

            <Select
              label={i18n.t("settings_page.language")}
              value={languagePreference}
              onChange={(value) =>
                setLanguagePreference(value as LanguagePreference)
              }
              options={[
                {
                  value: "system",
                  label: i18n.t("settings_page.language_system"),
                },
                {
                  value: "en",
                  label: i18n.t("settings_page.language_en"),
                },
                {
                  value: "es",
                  label: i18n.t("settings_page.language_es"),
                },
                {
                  value: "pt-BR",
                  label: i18n.t("settings_page.language_pt_br"),
                },
              ]}
            />
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
