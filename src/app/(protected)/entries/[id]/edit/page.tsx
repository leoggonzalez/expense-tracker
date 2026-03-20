import { notFound } from "next/navigation";

import { getSpaces, getEntryById } from "@/actions/entries";
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
  const [entry, spaces] = await Promise.all([
    getEntryById(id),
    getSpaces(),
  ]);

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
            spaces={spaces.map((space) => space.name)}
            initialData={{
              id: entry.id,
              type: entry.type,
              spaceName: entry.space.name,
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
