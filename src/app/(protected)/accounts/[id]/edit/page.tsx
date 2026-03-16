import { notFound } from "next/navigation";

import { getAccountForEdit } from "@/actions/accounts";
import { AccountEditForm, AccountFormPage } from "@/components";
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
    <AccountFormPage
      title={String(i18n.t("accounts_page.edit_account"))}
      subtitle={String(i18n.t("accounts_page.edit_account_hint"))}
      backHref={`/accounts/${account.id}`}
      backLabel={String(i18n.t("accounts_page.back_to_account"))}
    >
      <AccountEditForm accountId={account.id} initialName={account.name} />
    </AccountFormPage>
  );
}
