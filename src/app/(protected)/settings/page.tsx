import { SettingsPreferencesSection } from "@/app/(protected)/settings/settings_preferences_section";
import { Container, Hero } from "@/components";
import { Stack, Text } from "@/elements";

import { i18n } from "@/model/i18n";

export default function Page(): React.ReactElement {
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

        <SettingsPreferencesSection />
      </Stack>
    </Container>
  );
}
