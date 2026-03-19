import {
  AccountCard,
  AppLink,
  Button,
  Container,
  Hero,
  HeroMetric,
  HeroMetrics,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { addMonths, format } from "date-fns";

import { getAccountsCurrentMonthSummary } from "@/actions/accounts";
import { i18n } from "@/model/i18n";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

type AccountsRouteProps = {
  searchParams: Promise<{
    currentMonth?: string;
  }>;
};

function parseCurrentMonthOrNow(currentMonth: string | undefined): Date {
  if (!currentMonth || !/^\d{4}-\d{2}$/.test(currentMonth)) {
    return startOfMonth(new Date());
  }

  const parsed = new Date(`${currentMonth}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return startOfMonth(new Date());
  }

  return startOfMonth(parsed);
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat(i18n.locale || "en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export default async function Page({
  searchParams,
}: AccountsRouteProps): Promise<React.ReactElement> {
  const query = await searchParams;
  const selectedMonthStart = parseCurrentMonthOrNow(query.currentMonth);
  const accounts = await getAccountsCurrentMonthSummary(selectedMonthStart);
  const selectedMonthLabel = formatMonthLabel(selectedMonthStart);
  const previousMonthKey = formatMonthKey(addMonths(selectedMonthStart, -1));
  const nextMonthKey = formatMonthKey(addMonths(selectedMonthStart, 1));

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="accounts"
          title={String(i18n.t("accounts_page.title"))}
          pattern="accounts"
          actions={
            <form action="/accounts/new" method="get">
              <Button type="submit">
                <Icon name="plus" size={18} />
              </Button>
            </form>
          }
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="inverse">
              {i18n.t("accounts_page.hero_subtitle")}
            </Text>

            <HeroMetrics columns={2}>
              <HeroMetric tone="soft">
                <Stack gap={16}>
                  <Text size="sm" color="inverse">
                    {i18n.t("accounts_page.month_total_overview")}
                  </Text>
                  <Stack
                    direction="row"
                    align="center"
                    justify="space-between"
                    gap={12}
                  >
                    <Button
                      href={`/accounts?currentMonth=${previousMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("common.previous"))}
                    >
                      <Icon name="chevron-left" size={18} />
                    </Button>
                    <Text size="lg" weight="semibold" color="inverse">
                      {selectedMonthLabel}
                    </Text>
                    <Button
                      href={`/accounts?currentMonth=${nextMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("common.next"))}
                    >
                      <Icon name="chevron-right" size={18} />
                    </Button>
                  </Stack>
                </Stack>
              </HeroMetric>
              <HeroMetric>
                <Text size="sm" color="inverse">
                  {i18n.t("accounts_page.active_accounts_label")}
                </Text>
                <Text size="h3" weight="bold" color="inverse">
                  {String(accounts.length)}
                </Text>
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        {accounts.length === 0 ? (
          <Card padding={24} variant="dashed">
            <Text color="secondary">{i18n.t("accounts_page.empty_state")}</Text>
          </Card>
        ) : (
          <Stack gap={24}>
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                id={account.id}
                name={account.name}
                currentMonthTotal={account.currentMonthTotal}
                monthLabel={selectedMonthLabel}
              />
            ))}
          </Stack>
        )}

        <AppLink href="/accounts/archived">
          {i18n.t("accounts_page.archived_accounts")}
        </AppLink>
      </Stack>
    </Container>
  );
}
