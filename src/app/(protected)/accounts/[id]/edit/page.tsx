import { notFound } from "next/navigation";

import { getAccountForEdit } from "@/actions/accounts";
import {
  AccountEditForm,
  AppLink,
  Container,
  Hero,
  PagePanel,
} from "@/components";
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
        <Hero
          icon="accounts"
          title={String(i18n.t("accounts_page.edit_account"))}
          pattern="account_form"
        >
          <Text as="p" size="sm" color="inverse">
            {i18n.t("accounts_page.edit_account_hint")}
          </Text>
        </Hero>

        <PagePanel tone="form">
          <AccountEditForm accountId={account.id} initialName={account.name} />
        </PagePanel>

        <AppLink href={`/accounts/${account.id}`}>
          {i18n.t("accounts_page.back_to_account")}
        </AppLink>
      </Stack>
    </Container>
  );
}
