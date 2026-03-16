import { getAccountsCurrentMonthSummary } from "@/actions/accounts";
import {
  AccountCard,
  AppLink,
  Button,
  Container,
  Hero,
  HeroActionLink,
  HeroMetric,
  HeroMetrics,
} from "@/components";
import { Card, Stack, Text } from "@/elements";
import { startOfMonth } from "date-fns";
import { addMonths, format } from "date-fns";
import { i18n } from "@/model/i18n";

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
            <>
              <HeroActionLink
                href={`/accounts?currentMonth=${previousMonthKey}`}
              >
                {i18n.t("projection_page.previous_month")}
              </HeroActionLink>
              <HeroActionLink href={`/accounts?currentMonth=${nextMonthKey}`}>
                {i18n.t("projection_page.next_month")}
              </HeroActionLink>
              <form action="/accounts/new" method="get">
                <Button type="submit">
                  {i18n.t("accounts_page.create_account")}
                </Button>
              </form>
            </>
          }
        >
          <Stack gap={24}>
            <Stack gap={10}>
              <Text as="h1" size="h1" color="inverse" weight="bold">
                {selectedMonthLabel}
              </Text>
              <Text as="p" size="sm" color="inverse">
                {i18n.t("accounts_page.hero_subtitle")}
              </Text>
            </Stack>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Text size="sm" color="inverse">
                  {i18n.t("accounts_page.active_accounts_label")}
                </Text>
                <Text size="h3" weight="bold" color="inverse">
                  {String(accounts.length)}
                </Text>
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text size="sm" color="inverse">
                  {i18n.t("accounts_page.month_total_overview")}
                </Text>
                <Text size="lg" weight="semibold" color="inverse">
                  {selectedMonthLabel}
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
