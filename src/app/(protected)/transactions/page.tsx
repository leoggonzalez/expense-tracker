import { Container, Hero } from "@/components";
import { TransactionsResultsSection } from "@/app/(protected)/transactions/transactions_results_section";
import { Stack, Text } from "@/elements";
import { normalizeTransactionsFilters } from "@/lib/transactions_search";
import { i18n } from "@/model/i18n";

type TransactionsPageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

type TransactionsPageProps = {
  searchParams: TransactionsPageSearchParams;
};

export default async function Page({
  searchParams,
}: TransactionsPageProps): Promise<React.ReactElement> {
  const filters = normalizeTransactionsFilters(await searchParams);

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="transactions"
          title={String(i18n.t("transactions_page.title"))}
          pattern="transactions"
          actions={[
            {
              icon: "plus",
              title: String(i18n.t("transactions_page.add_transaction")),
              ariaLabel: String(i18n.t("transactions_page.add_transaction")),
              href: "/transactions/new/expense",
              variant: "primary",
            },
            {
              icon: "transactions",
              title: String(
                i18n.t("transactions_page.add_multiple_transactions"),
              ),
              ariaLabel: String(
                i18n.t("transactions_page.add_multiple_transactions"),
              ),
              href: "/transactions/new/multiple",
              variant: "outline",
            },
          ]}
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="hero-muted">
              {i18n.t("transactions_page.subtitle")}
            </Text>
          </Stack>
        </Hero>

        <TransactionsResultsSection filters={filters} />
      </Stack>
    </Container>
  );
}
