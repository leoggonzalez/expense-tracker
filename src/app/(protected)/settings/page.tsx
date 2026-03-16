import {
  Container,
  Hero,
  PagePanel,
  SettingsPreferencesForm,
} from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="settings"
          title={String(i18n.t("settings_page.title"))}
          pattern="settings"
        >
          <Text as="p" size="sm" color="inverse">
            {i18n.t("settings_page.subtitle")}
          </Text>
        </Hero>

        <PagePanel tone="settings">
          <SettingsPreferencesForm />
        </PagePanel>
      </Stack>
    </Container>
  );
}
