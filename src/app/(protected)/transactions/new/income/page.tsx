import {
  Container,
  TransactionCreationIntro,
  TransactionTypeTabs,
  Hero,
} from "@/components";
import { NewTransactionFormSection } from "@/app/(protected)/transactions/new/new_transaction_form_section";
import { Stack } from "@/elements";
import { i18n } from "@/model/i18n";

export default async function Page(): Promise<React.ReactElement> {
  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="income"
          title={String(i18n.t("new_transaction_page.title_income"))}
          pattern="new_transaction"
        >
          <TransactionCreationIntro
            pageType="income"
            subtitle={i18n.t("new_transaction_page.subtitle_income")}
          />
        </Hero>

        <TransactionTypeTabs
          activeType="income"
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

        <NewTransactionFormSection pageType="income" />
      </Stack>
    </Container>
  );
}
