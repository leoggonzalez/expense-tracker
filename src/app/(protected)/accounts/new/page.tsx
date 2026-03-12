import { AccountCreateForm, AppLink, Container } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default function Page(): React.ReactElement {
  return (
    <Container>
      <Stack gap={24}>
        <Stack gap={8}>
          <Text size="h2" as="h1" weight="bold">
            {i18n.t("accounts_page.create_account")}
          </Text>
          <Text size="sm" color="secondary">
            {i18n.t("accounts_page.create_account_hint")}
          </Text>
        </Stack>

        <AccountCreateForm />

        <AppLink href="/accounts">
          {i18n.t("accounts_page.back_to_accounts")}
        </AppLink>
      </Stack>
    </Container>
  );
}
