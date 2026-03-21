import { AccountProfileSection } from "@/app/(protected)/account/account_profile_section";
import { Container, Hero } from "@/components";
import { Stack, Text } from "@/elements";

import { i18n } from "@/model/i18n";

export default function Page(): React.ReactElement {
  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="settings"
          title={String(i18n.t("account.title"))}
          pattern="settings"
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="hero-muted">
              {i18n.t("account.subtitle")}
            </Text>
          </Stack>
        </Hero>

        <AccountProfileSection />
      </Stack>
    </Container>
  );
}
