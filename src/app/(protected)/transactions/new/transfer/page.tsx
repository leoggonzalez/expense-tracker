import { getSpacesCurrentMonthSummary } from "@/actions/spaces";
import {
  Container,
  TransactionCreationIntro,
  TransactionTypeTabs,
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
  to_space?: string;
  description?: string;
  amount?: string;
}>;

type TransferPageProps = {
  searchParams: TransferPageSearchParams;
};

function getDefaultDescription(spaceName: string): string {
  const monthLabel = format(new Date(), "MMMM yyyy");
  return String(
    i18n.t("spaces_page.settle_description", {
      space: spaceName,
      month: monthLabel,
    }),
  );
}

export default async function Page({
  searchParams,
}: TransferPageProps): Promise<React.ReactElement> {
  const [spaces, params] = await Promise.all([
    getSpacesCurrentMonthSummary(),
    searchParams,
  ]);

  const toSpace = spaces.find(
    (space) => space.id === params.to_space,
  );
  const normalizedAmount = sanitizeAmountInput(params.amount || "");
  const initialValues = {
    toSpaceId: toSpace?.id || "",
    description:
      params.description ||
      (toSpace ? getDefaultDescription(toSpace.name) : ""),
    amount: normalizedAmount,
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

        <PagePanel tone="form">
          <TransferForm
            spaces={spaces.map((space) => ({
              id: space.id,
              name: space.name,
              currentMonthTotal: space.currentMonthTotal,
            }))}
            initialValues={initialValues}
          />
        </PagePanel>
      </Stack>
    </Container>
  );
}
