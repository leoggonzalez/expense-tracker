import { Card, Stack, Text } from "@/elements";
import {
  Button,
  Container,
  TransactionsFilters,
  TransactionsTable,
  Hero,
} from "@/components";
import { getSpaces, getTransactionsWithFilters } from "@/actions/transactions";

import { i18n } from "@/model/i18n";

export const dynamic = "force-dynamic";

type TransactionsPageSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

type TransactionsPageProps = {
  searchParams: TransactionsPageSearchParams;
};

export default async function Page({
  searchParams,
}: TransactionsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(
    1,
    Number(
      (Array.isArray(params.page) ? params.page[0] : params.page) || "1",
    ) || 1,
  );
  const space = Array.isArray(params.space)
    ? params.space[0] || ""
    : params.space || "";
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const type =
    rawType === "income" || rawType === "expense" || rawType === "transfer"
      ? rawType
      : "";
  const startDate = Array.isArray(params.start_date)
    ? params.start_date[0] || ""
    : params.start_date || "";
  const endDate = Array.isArray(params.end_date)
    ? params.end_date[0] || ""
    : params.end_date || "";
  const rawSearchTerms = Array.isArray(params.search)
    ? params.search
    : params.search
      ? [params.search]
      : [];
  const searchTerms = Array.from(
    new Set(rawSearchTerms.map((term) => term.trim()).filter(Boolean)),
  );

  const [transactionsData, spaces] = await Promise.all([
    getTransactionsWithFilters({
      spaceId: space || undefined,
      type: type || undefined,
      searchTerms,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit: 20,
    }),
    getSpaces(),
  ]);

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
              title: String(i18n.t("transactions_page.add_multiple_transactions")),
              ariaLabel: String(i18n.t("transactions_page.add_multiple_transactions")),
              href: "/transactions/new/multiple",
              variant: "outline",
            },
          ]}
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="inverse">
              {i18n.t("transactions_page.subtitle")}
            </Text>
          </Stack>
        </Hero>

        <Card
          as="section"
          padding={24}
          title={String(i18n.t("transactions_page.results_title"))}
          icon="activity"
        >
          <Stack gap={20}>
            <TransactionsFilters
              spaces={spaces.map((transactionSpace) => ({
                id: transactionSpace.id,
                name: transactionSpace.name,
              }))}
              filters={{
                space,
                type,
                startDate,
                endDate,
                searchTerms,
              }}
            />

            <Text size="sm" color="secondary">
              {i18n.t("transactions_page.showing_results", {
                count: transactionsData.transactions.length,
                total: transactionsData.pagination.total,
              })}
            </Text>

            <TransactionsTable transactions={transactionsData.transactions} />

            {transactionsData.pagination.page < transactionsData.pagination.totalPages ? (
              <form method="get">
                {space ? (
                  <input type="hidden" name="space" value={space} />
                ) : null}
                {type ? <input type="hidden" name="type" value={type} /> : null}
                {startDate ? (
                  <input type="hidden" name="start_date" value={startDate} />
                ) : null}
                {endDate ? (
                  <input type="hidden" name="end_date" value={endDate} />
                ) : null}
                {searchTerms.map((searchTerm) => (
                  <input
                    key={searchTerm}
                    type="hidden"
                    name="search"
                    value={searchTerm}
                  />
                ))}
                <input
                  type="hidden"
                  name="page"
                  value={String(transactionsData.pagination.page + 1)}
                />
                <Button type="submit">
                  {i18n.t("transactions_page.load_more_transactions")}
                </Button>
              </form>
            ) : null}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
