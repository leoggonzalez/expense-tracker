import {
  AccountProfileForm,
  Container,
  Hero,
  HeroMetric,
  HeroMetrics,
  PagePanel,
} from "@/components";
import { Stack, Text } from "@/elements";

import { getCurrentUser } from "@/lib/session";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Expected authenticated user in protected account route.");
  }

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="accounts"
          title={String(i18n.t("account.title"))}
          pattern="account"
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="inverse">
              {i18n.t("account.subtitle")}
            </Text>
          </Stack>
        </Hero>

        <PagePanel tone="form">
          <AccountProfileForm
            user={{
              email: currentUser.email,
              name: currentUser.name,
            }}
          />
        </PagePanel>
      </Stack>
    </Container>
  );
}
