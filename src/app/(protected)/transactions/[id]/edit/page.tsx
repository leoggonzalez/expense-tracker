import { notFound } from "next/navigation";

import { getSpaces, getTransactionById } from "@/actions/transactions";
import { AppLink, Container, TransactionForm } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

type TransactionEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: TransactionEditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [transaction, spaces] = await Promise.all([
    getTransactionById(id),
    getSpaces(),
  ]);

  if (!transaction) {
    notFound();
  }

  return (
    <Container>
      <Stack gap={24}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("transaction_detail_page.edit_transaction")}
        </Text>
        <Card padding={24}>
          <TransactionForm
            spaces={spaces.map((space) => space.name)}
            initialData={{
              id: transaction.id,
              type: transaction.type,
              spaceName: transaction.space.name,
              description: transaction.description,
              amount: transaction.amount,
              beginDate: transaction.beginDate.toISOString(),
              endDate: transaction.endDate?.toISOString() || null,
            }}
            isEdit
          />
        </Card>
        <AppLink href={`/transactions/${transaction.id}`}>
          {i18n.t("transaction_detail_page.back_to_details")}
        </AppLink>
      </Stack>
    </Container>
  );
}
