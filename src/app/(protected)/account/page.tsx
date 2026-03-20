import { AccountProfileForm, Container, Hero, PagePanel } from "@/components";
import { Stack, Text } from "@/elements";

import { getCurrentUserAccount } from "@/lib/session";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    throw new Error("Expected authenticated userAccount in protected account route.");
  }

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="settings"
          title={String(i18n.t("account.title"))}
          pattern="settings"
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="inverse">
              {i18n.t("account.subtitle")}
            </Text>
          </Stack>
        </Hero>

        <PagePanel tone="form">
          <AccountProfileForm
            userAccount={{
              email: currentUser.email,
              name: currentUser.name,
            }}
          />
        </PagePanel>
      </Stack>
    </Container>
  );
}
