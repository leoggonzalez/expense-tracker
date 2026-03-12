import {
  getArchivedAccountsCurrentMonthSummary,
  unarchiveAccount,
} from "@/actions/accounts";
import { AppLink, Avatar, Button, Container, Currency } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default async function Page(): Promise<React.ReactElement> {
  const accounts = await getArchivedAccountsCurrentMonthSummary();

  async function handleUnarchiveAction(formData: FormData): Promise<void> {
    "use server";

    const accountId = String(formData.get("accountId") || "");

    if (!accountId) {
      return;
    }

    await unarchiveAccount(accountId);
  }

  return (
    <Container>
      <Stack gap={24}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("accounts_page.archived_accounts")}
        </Text>

        {accounts.length === 0 ? (
          <Card padding={24} variant="dashed">
            <Text color="secondary">
              {i18n.t("accounts_page.empty_archived_state")}
            </Text>
          </Card>
        ) : (
          <Stack gap={16}>
            {accounts.map((account) => (
              <Card key={account.id} padding={16}>
                <Stack
                  direction="row"
                  align="center"
                  justify="space-between"
                  gap={12}
                >
                  <Stack direction="row" align="center" gap={12}>
                    <Avatar name={account.name} />
                    <Stack gap={4}>
                      <Text size="md" weight="semibold">
                        {account.name}
                      </Text>
                      <Currency
                        value={account.currentMonthTotal}
                        size="sm"
                        weight="bold"
                      />
                    </Stack>
                  </Stack>

                  <form action={handleUnarchiveAction}>
                    <input type="hidden" name="accountId" value={account.id} />
                    <Button type="submit">
                      {i18n.t("accounts_page.unarchive")}
                    </Button>
                  </form>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}

        <AppLink href="/accounts">
          {i18n.t("accounts_page.back_to_accounts")}
        </AppLink>
      </Stack>
    </Container>
  );
}
