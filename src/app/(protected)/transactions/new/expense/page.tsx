import {
  Container,
  PagePanel,
  TransactionCreationIntro,
  TransactionForm,
  TransactionTypeTabs,
  Hero,
} from "@/components";
import { Stack } from "@/elements";
import { i18n } from "@/model/i18n";

export default async function Page(): Promise<React.ReactElement> {
  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="expense"
          title={String(i18n.t("new_transaction_page.title_expense"))}
          pattern="new_transaction"
        >
          <TransactionCreationIntro
            pageType="expense"
            subtitle={i18n.t("new_transaction_page.subtitle_expense")}
          />
        </Hero>

        <TransactionTypeTabs
          activeType="expense"
          tabs={[
            {
              key: "income",
              href: "/transactions/new/income",
              label: i18n.t("new_transaction_page.income_tab"),
            },
            {
              key: "expense",
              href: "/transactions/new/expense",
              label: i18n.t("new_transaction_page.expense_tab"),
            },
            {
              key: "transfer",
              href: "/transactions/new/transfer",
              label: i18n.t("new_transaction_page.transfer_tab"),
            },
          ]}
        />

        <PagePanel tone="form">
          <TransactionForm spaces={[]} transactionType="expense" hideTypeField />
        </PagePanel>
      </Stack>
    </Container>
  );
}
