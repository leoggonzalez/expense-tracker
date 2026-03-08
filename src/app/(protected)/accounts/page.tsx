import { getAccountsCurrentMonthSummary } from "@/actions/accounts";
import { AppLink, Avatar, Button, Container } from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}${Math.abs(amount).toFixed(2)} €`;
}

export default async function Page(): Promise<React.ReactElement> {
  const accounts = await getAccountsCurrentMonthSummary();

  return (
    <Container>
      <Stack gap={24}>
        <Stack direction="row" align="center" justify="space-between" gap={16}>
          <Text size="h2" as="h1" weight="bold">
            {i18n.t("accounts_page.title")}
          </Text>
          <form action="/accounts/new" method="get">
            <Button type="submit" startIcon={<Icon name="plus" />}>
              {i18n.t("accounts_page.create_account")}
            </Button>
          </form>
        </Stack>

        {accounts.length === 0 ? (
          <Card padding={24} variant="dashed">
            <Text color="secondary">{i18n.t("accounts_page.empty_state")}</Text>
          </Card>
        ) : (
          <Stack gap={16}>
            {accounts.map((account) => (
              <Card key={account.id} padding={16}>
                <AppLink href={`/accounts/${account.id}`}>
                  <Stack
                    direction="row"
                    align="center"
                    justify="space-between"
                    gap={12}
                  >
                    <Stack direction="row" align="center" gap={12}>
                      <Avatar name={account.name} />
                      <Text size="md" weight="semibold">
                        {account.name}
                      </Text>
                    </Stack>
                    <Text
                      size="md"
                      weight="bold"
                      color={
                        account.currentMonthTotal >= 0 ? "success" : "danger"
                      }
                    >
                      {formatCurrency(account.currentMonthTotal)}
                    </Text>
                  </Stack>
                </AppLink>
              </Card>
            ))}
          </Stack>
        )}

        <AppLink href="/accounts/archived">
          {i18n.t("accounts_page.archived_accounts")}
        </AppLink>
      </Stack>
    </Container>
  );
}
