import { getAccountsCurrentMonthSummary } from "@/actions/accounts";
import { NewEntryPage, TransferForm } from "@/components";
import { sanitizeAmountInput } from "@/lib/amount";
import { format } from "date-fns";
import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

type TransferPageSearchParams = Promise<{
  to_account?: string;
  description?: string;
  amount?: string;
}>;

type TransferPageProps = {
  searchParams: TransferPageSearchParams;
};

function getDefaultDescription(accountName: string): string {
  const monthLabel = format(new Date(), "MMMM yyyy");
  return String(
    i18n.t("accounts_page.settle_description", {
      account: accountName,
      month: monthLabel,
    }),
  );
}

export default async function Page({
  searchParams,
}: TransferPageProps): Promise<React.ReactElement> {
  const [accounts, params] = await Promise.all([
    getAccountsCurrentMonthSummary(),
    searchParams,
  ]);

  const toAccount = accounts.find(
    (account) => account.id === params.to_account,
  );
  const normalizedAmount = sanitizeAmountInput(params.amount || "");
  const initialValues = {
    toAccountId: toAccount?.id || "",
    description:
      params.description ||
      (toAccount ? getDefaultDescription(toAccount.name) : ""),
    amount: normalizedAmount,
  };

  return (
    <NewEntryPage pageType="transfer">
      <TransferForm
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.name,
          currentMonthTotal: account.currentMonthTotal,
        }))}
        initialValues={initialValues}
      />
    </NewEntryPage>
  );
}
