import { AccountCreateForm, AccountFormPage } from "@/components";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

export default function Page(): React.ReactElement {
  return (
    <AccountFormPage
      title={String(i18n.t("accounts_page.create_account"))}
      subtitle={String(i18n.t("accounts_page.create_account_hint"))}
      backHref="/accounts"
      backLabel={String(i18n.t("accounts_page.back_to_accounts"))}
    >
      <AccountCreateForm />
    </AccountFormPage>
  );
}
