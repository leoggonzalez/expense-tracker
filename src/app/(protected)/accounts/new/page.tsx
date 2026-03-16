import {
  AccountCreateForm,
  AppLink,
  Container,
  Hero,
  PagePanel,
} from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default function Page(): React.ReactElement {
  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="accounts"
          title={String(i18n.t("accounts_page.create_account"))}
          pattern="account_form"
        >
          <Text as="p" size="sm" color="inverse">
            {i18n.t("accounts_page.create_account_hint")}
          </Text>
        </Hero>

        <PagePanel tone="form">
          <AccountCreateForm />
        </PagePanel>

        <AppLink href="/accounts">
          {i18n.t("accounts_page.back_to_accounts")}
        </AppLink>
      </Stack>
    </Container>
  );
}
