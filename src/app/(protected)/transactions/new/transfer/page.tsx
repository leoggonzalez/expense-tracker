import {
  Container,
  TransactionCreationIntro,
  TransactionTypeTabs,
  Hero,
} from "@/components";
import { NewTransferFormSection } from "@/app/(protected)/transactions/new/new_transfer_form_section";
import { sanitizeAmountInput } from "@/lib/amount";
import { Stack } from "@/elements";
import { i18n } from "@/model/i18n";

type TransferPageSearchParams = Promise<{
  from_space?: string;
  to_space?: string;
  description?: string;
  amount?: string;
}>;

type TransferPageProps = {
  searchParams: TransferPageSearchParams;
};

export default async function Page({
  searchParams,
}: TransferPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const initialValues = {
    fromSpaceId: params.from_space || "",
    toSpaceId: params.to_space || "",
    description: params.description || "",
    amount: sanitizeAmountInput(params.amount || ""),
  };

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="transfer"
          title={String(i18n.t("new_transaction_page.title_transfer"))}
          pattern="new_transaction"
        >
          <TransactionCreationIntro
            pageType="transfer"
            subtitle={i18n.t("new_transaction_page.subtitle_transfer")}
          />
        </Hero>

        <TransactionTypeTabs
          activeType="transfer"
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

        <NewTransferFormSection initialValues={initialValues} />
      </Stack>
    </Container>
  );
}
