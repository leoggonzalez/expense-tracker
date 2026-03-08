import { notFound } from "next/navigation";

import { getAccounts, getEntryById } from "@/actions/entries";
import { AppLink, Container, EntryForm } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

type EntryEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: EntryEditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [entry, accounts] = await Promise.all([getEntryById(id), getAccounts()]);

  if (!entry) {
    notFound();
  }

  return (
    <Container>
      <Stack gap={24}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("entry_detail_page.edit_entry")}
        </Text>
        <Card padding={24}>
          <EntryForm
            accounts={accounts.map((account) => account.name)}
            initialData={{
              id: entry.id,
              type: entry.type,
              accountName: entry.account.name,
              description: entry.description,
              amount: entry.amount,
              beginDate: entry.beginDate.toISOString(),
              endDate: entry.endDate?.toISOString() || null,
            }}
            isEdit
          />
        </Card>
        <AppLink href={`/entries/${entry.id}`}>
          {i18n.t("entry_detail_page.back_to_details")}
        </AppLink>
      </Stack>
    </Container>
  );
}
