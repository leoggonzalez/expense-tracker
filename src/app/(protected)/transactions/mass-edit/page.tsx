import { getMassEditTransactions } from "@/actions/mass_transactions";
import { getSpaces } from "@/actions/transactions";
import { AppLink, Container } from "@/components";
import { MassTransactionForm } from "@/components/mass_transaction_form/mass_transaction_form";
import { Card, Stack, Text } from "@/elements";
import { getMassEditBlockReason } from "@/lib/mass_transaction_edit";
import { requireCurrentUserAccount } from "@/lib/session";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

interface MassEditPageProps {
  searchParams: Promise<{ ids?: string; space?: string; month?: string }>;
}

export default async function Page({
  searchParams,
}: MassEditPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const user = await requireCurrentUserAccount();
  const ids =
    typeof params.ids === "string" ? params.ids.split(",").filter(Boolean) : [];
  const [transactions, spaces] = await Promise.all([
    getMassEditTransactions(ids),
    getSpaces(),
  ]);
  const sourceSpace = spaces.find((space) => space.id === params.space);
  const month =
    typeof params.month === "string" && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : undefined;
  const backHref = sourceSpace
    ? `/spaces/${sourceSpace.id}${month ? `?currentMonth=${month}` : ""}`
    : "/transactions";
  const reason = transactions?.length
    ? getMassEditBlockReason(transactions)
    : "mass_edit.empty";
  return (
    <Container>
      <Stack gap={24}>
        <Text element="h1" type="h2-bold">
          {i18n.t("mass_edit.title")}
        </Text>
        <Card padding={24}>
          {transactions?.length && !reason ? (
            <MassTransactionForm
              transactions={transactions}
              spaces={spaces.map((space) => ({
                id: space.id,
                name: space.name,
              }))}
              ownerId={user.id}
              backHref={backHref}
            />
          ) : (
            <Text element="p">
              {i18n.t(reason || "mass_edit.invalid_selection")}
            </Text>
          )}
        </Card>
        <AppLink href={backHref}>
          {i18n.t(sourceSpace ? "mass_edit.back" : "mass_edit.browse")}
        </AppLink>
      </Stack>
    </Container>
  );
}
