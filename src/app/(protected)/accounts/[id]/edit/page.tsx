import { notFound } from "next/navigation";

import { getAccountForEdit } from "@/actions/accounts";
import { AccountEditForm, AppLink, Container } from "@/components";
import { Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

type AccountEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({
  params,
}: AccountEditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const account = await getAccountForEdit(id);

  if (!account) {
    notFound();
  }

  return (
    <Container>
      <Stack gap={24}>
        <Text size="h2" as="h1" weight="bold">
          {i18n.t("accounts_page.edit_account")}
        </Text>

        <AccountEditForm accountId={account.id} initialName={account.name} />

        <AppLink href={`/accounts/${account.id}`}>
          {i18n.t("accounts_page.back_to_account")}
        </AppLink>
      </Stack>
    </Container>
  );
}
