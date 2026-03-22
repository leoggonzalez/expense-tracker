"use client";

import type { SpaceDetailPayload } from "@/actions/spaces";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  AppLink,
  Button,
  Container,
  Currency,
  Hero,
  HeroMetric,
  HeroMetrics,
  LoadingSkeleton,
  TransactionList,
  type HeroAction,
} from "@/components";
import { SpaceArchiveDialog } from "@/components/space_archive_dialog/space_archive_dialog";
import { Card, Icon, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import React from "react";

const spaceDetailCache = {
  entries: new Map<string, SpaceDetailPayload>(),
};

type SpaceDetailSectionProps = {
  id: string;
  currentMonthKey: string;
  currentMonthLabel: string;
  previousMonthKey: string;
  nextMonthKey: string;
  page: number;
  isArchiveDialogOpen: boolean;
  isUnarchiveDialogOpen: boolean;
};

function SpaceDetailSkeleton({
  id,
  currentMonthLabel,
  previousMonthKey,
  nextMonthKey,
}: Pick<
  SpaceDetailSectionProps,
  "id" | "currentMonthLabel" | "previousMonthKey" | "nextMonthKey"
>): React.ReactElement {
  return (
    <Container>
      <Stack gap={24}>
        <Hero icon="spaces" title="" pattern="space_detail">
          <Stack gap={24}>
            <LoadingSkeleton width="280px" height={22} radius={10} />
            <HeroMetrics columns={2}>
              <HeroMetric>
                <Stack gap={16}>
                  <Text size="sm" color="hero">
                    {i18n.t("spaces_page.month_total_label", {
                      month: currentMonthLabel,
                    })}
                  </Text>
                  <LoadingSkeleton width="140px" height={38} radius={14} />
                  <Stack
                    direction="row"
                    align="center"
                    justify="space-between"
                    gap={12}
                  >
                    <Button
                      href={`/spaces/${id}?currentMonth=${previousMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("pagination.previous"))}
                    >
                      <Icon name="chevron-left" size={18} />
                    </Button>
                    <Text size="sm" color="hero" weight="medium">
                      {currentMonthLabel}
                    </Text>
                    <Button
                      href={`/spaces/${id}?currentMonth=${nextMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("pagination.next"))}
                    >
                      <Icon name="chevron-right" size={18} />
                    </Button>
                  </Stack>
                </Stack>
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text size="sm" color="hero">
                  {i18n.t("spaces_page.historical_total")}
                </Text>
                <LoadingSkeleton width="140px" height={38} radius={14} />
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        <Card padding={24}>
          <Stack gap={16}>
            <LoadingSkeleton width="100%" height={22} radius={10} />
            <LoadingSkeleton width="100%" height={92} radius={20} />
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

export function SpaceDetailSection({
  id,
  currentMonthKey,
  currentMonthLabel,
  previousMonthKey,
  nextMonthKey,
  page,
  isArchiveDialogOpen,
  isUnarchiveDialogOpen,
}: SpaceDetailSectionProps): React.ReactElement {
  const endpoint = `/api/spaces/${id}?currentMonth=${currentMonthKey}&page=${String(page)}`;
  const { data, isLoading, hasError, isNotFound, retry } =
    useProtectedPageSection(endpoint, endpoint, spaceDetailCache);
  const [visibleData, setVisibleData] =
    React.useState<SpaceDetailPayload | null>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  React.useEffect(() => {
    setVisibleData(data);
  }, [data]);

  if (hasError && !data) {
    return (
      <Container>
        <Card padding={24}>
          <Stack gap={12} align="flex-start">
            <Text color="secondary">
              {i18n.t("spaces_page.detail_load_failed")}
            </Text>
            <Button variant="secondary" size="sm" onClick={retry}>
              {i18n.t("common.retry")}
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (isNotFound) {
    return (
      <Container>
        <Stack gap={24}>
          <Card padding={24}>
            <Text color="secondary">
              {i18n.t("space_detail_page.not_found")}
            </Text>
          </Card>
          <AppLink href="/spaces">
            {i18n.t("spaces_page.back_to_spaces")}
          </AppLink>
        </Stack>
      </Container>
    );
  }

  if (isLoading && !data) {
    return (
      <SpaceDetailSkeleton
        id={id}
        currentMonthLabel={currentMonthLabel}
        previousMonthKey={previousMonthKey}
        nextMonthKey={nextMonthKey}
      />
    );
  }

  if (!data) {
    return <></>;
  }
  const currentData = visibleData || data;

  const detailSearchParams = new URLSearchParams();

  if (currentMonthKey) {
    detailSearchParams.set("currentMonth", currentMonthKey);
  }

  if (currentData.pagination.page > 1) {
    detailSearchParams.set("page", String(currentData.pagination.page));
  }

  const detailHref =
    detailSearchParams.size > 0
      ? `/spaces/${currentData.space.id}?${detailSearchParams.toString()}`
      : `/spaces/${currentData.space.id}`;
  const confirmArchiveHref =
    detailSearchParams.size > 0
      ? `${detailHref}&confirmArchive=1`
      : `/spaces/${currentData.space.id}?confirmArchive=1`;
  const confirmUnarchiveHref =
    detailSearchParams.size > 0
      ? `${detailHref}&confirmUnarchive=1`
      : `/spaces/${currentData.space.id}?confirmUnarchive=1`;
  const settleHref = `/transactions/new/transfer?${new URLSearchParams({
    to_space: currentData.space.id,
    amount: Math.abs(currentData.space.selectedMonthTotal).toFixed(2),
    description: String(
      i18n.t("spaces_page.settle_description", {
        space: currentData.space.name,
        month: currentMonthLabel,
      }),
    ),
  }).toString()}`;
  const heroActions: HeroAction[] = currentData.space.isArchived
    ? [
        {
          icon: "check",
          ariaLabel: String(i18n.t("spaces_page.unarchive")),
          href: confirmUnarchiveHref,
          variant: "outline",
        },
      ]
    : [
        {
          icon: "edit",
          ariaLabel: String(i18n.t("spaces_page.edit_space")),
          href: `/spaces/${currentData.space.id}/edit`,
          variant: "outline",
        },
        {
          icon: "transfer",
          ariaLabel: String(i18n.t("spaces_page.settle")),
          href: settleHref,
          variant: "outline-transfer",
          disabled: currentData.space.selectedMonthTotal >= 0,
        },
        {
          icon: "alert",
          ariaLabel: String(i18n.t("spaces_page.archive")),
          href: confirmArchiveHref,
          variant: "outline-danger",
        },
      ];

  const handleLoadMore = async (): Promise<void> => {
    if (!currentData.pagination.hasMore || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/spaces/${id}?currentMonth=${currentMonthKey}&page=${String(
          currentData.pagination.page + 1,
        )}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        },
      );

      if (!response.ok) {
        throw new Error("space_detail_load_more_failed");
      }

      const nextPayload = (await response.json()) as SpaceDetailPayload;
      setVisibleData(nextPayload);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <Container>
      <Stack gap={24}>
        <Hero
          icon="spaces"
          title={currentData.space.name}
          pattern="space_detail"
          actions={heroActions}
        >
          <Stack gap={24}>
            <Text as="p" size="sm" color="hero-muted">
              {i18n.t("spaces_page.detail_hero_subtitle", {
                month: currentMonthLabel,
              })}
            </Text>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Stack gap={16}>
                  <Text size="sm" color="hero">
                    {i18n.t("spaces_page.month_total_label", {
                      month: currentMonthLabel,
                    })}
                  </Text>
                  <Currency
                    value={currentData.space.selectedMonthTotal}
                    size="h3"
                    weight="bold"
                    color="hero"
                  />
                  <Stack
                    direction="row"
                    align="center"
                    justify="space-between"
                    gap={12}
                  >
                    <Button
                      href={`/spaces/${currentData.space.id}?currentMonth=${previousMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("pagination.previous"))}
                    >
                      <Icon name="chevron-left" size={18} />
                    </Button>
                    <Text size="sm" color="hero" weight="medium">
                      {currentMonthLabel}
                    </Text>
                    <Button
                      href={`/spaces/${currentData.space.id}?currentMonth=${nextMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("pagination.next"))}
                    >
                      <Icon name="chevron-right" size={18} />
                    </Button>
                  </Stack>
                </Stack>
              </HeroMetric>
              <HeroMetric tone="soft">
                <Text size="sm" color="hero">
                  {i18n.t("spaces_page.historical_total")}
                </Text>
                <Currency
                  value={currentData.space.historicalTotal}
                  size="h3"
                  weight="bold"
                  color="hero"
                />
              </HeroMetric>
            </HeroMetrics>
          </Stack>
        </Hero>

        <SpaceArchiveDialog
          spaceId={currentData.space.id}
          spaceName={currentData.space.name}
          isOpen={isArchiveDialogOpen || isUnarchiveDialogOpen}
          mode={isUnarchiveDialogOpen ? "unarchive" : "archive"}
          closeHref={detailHref}
        />

        {currentData.space.isArchived ? (
          <Card padding={24}>
            <Stack gap={18}>
              <Stack
                direction="column"
                desktopDirection="row"
                align="flex-start"
                justify="space-between"
                gap={16}
              >
                <Stack gap={8}>
                  <Text size="sm" weight="semibold" color="warning">
                    {i18n.t("spaces_page.archived_badge")}
                  </Text>
                  <Text size="sm" color="secondary">
                    {i18n.t("spaces_page.archived_space_hint")}
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        ) : null}

        <Card
          padding={24}
          title={String(
            i18n.t("spaces_page.month_relevant_transactions_label", {
              month: currentMonthLabel,
            }),
          )}
          icon="transactions"
        >
          <TransactionList
            transactions={currentData.selectedMonthRelevantTransactions}
            showDelete={false}
            transactionHrefBase="/transactions"
            summaryRows={[
              {
                id: "selected-month-relevant-total",
                label: i18n.t("spaces_page.month_relevant_total_label", {
                  month: currentMonthLabel,
                }) as string,
                value: (
                  <Currency
                    value={currentData.space.selectedMonthTotal}
                    size="sm"
                    weight="bold"
                  />
                ),
                tone: "emphasis",
              },
            ]}
          />
        </Card>

        <Card
          padding={24}
          title={String(i18n.t("spaces_page.all_transactions"))}
          icon="activity"
        >
          <Stack gap={20}>
            <TransactionList
              transactions={currentData.allTransactions}
              showDelete={false}
              transactionHrefBase="/transactions"
            />

            {currentData.pagination.hasMore ? (
              <Button
                onClick={() => void handleLoadMore()}
                disabled={isLoadingMore}
              >
                {isLoadingMore
                  ? i18n.t("common.loading")
                  : i18n.t("spaces_page.load_more_transactions")}
              </Button>
            ) : null}
          </Stack>
        </Card>

        <AppLink href="/spaces">{i18n.t("spaces_page.back_to_spaces")}</AppLink>
      </Stack>
    </Container>
  );
}
