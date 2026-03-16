import { getAccountsCurrentMonthSummary } from "@/actions/accounts";
import {
  Container,
  EntryCreationIntro,
  EntryTypeTabs,
  Hero,
  PagePanel,
  TransferForm,
} from "@/components";
import { sanitizeAmountInput } from "@/lib/amount";
import { format } from "date-fns";
import { Stack } from "@/elements";
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
    <Container>
      <Stack gap={24}>
        <Hero
          icon="transfer"
          title={String(i18n.t("new_entry_page.title_transfer"))}
          pattern="new_entry"
        >
          <EntryCreationIntro
            pageType="transfer"
            subtitle={i18n.t("new_entry_page.subtitle_transfer")}
          />
        </Hero>

        <EntryTypeTabs
          activeType="transfer"
          tabs={[
            {
              key: "income",
              href: "/entries/new/income",
              label: i18n.t("new_entry_page.income_tab"),
            },
            {
              key: "expense",
              href: "/entries/new/expense",
              label: i18n.t("new_entry_page.expense_tab"),
            },
            {
              key: "transfer",
              href: "/entries/new/transfer",
              label: i18n.t("new_entry_page.transfer_tab"),
            },
          ]}
        />

        <PagePanel tone="form">
          <TransferForm
            accounts={accounts.map((account) => ({
              id: account.id,
              name: account.name,
              currentMonthTotal: account.currentMonthTotal,
            }))}
            initialValues={initialValues}
          />
        </PagePanel>
      </Stack>
    </Container>
  );
}
