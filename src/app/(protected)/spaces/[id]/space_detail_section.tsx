"use client";

import { SectionError } from "@/components/section_error/section_error";

import { type SpaceDetailPayload } from "@/actions/spaces";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  AppLink,
  Button,
  Container,
  Currency,
  DetailList,
  DetailRow,
  Hero,
  HeroMetric,
  HeroMetrics,
  LoadingSkeleton,
  TransactionList,
  type HeroAction,
} from "@/components";
import { SpaceArchiveDialog } from "@/components/space_archive_dialog/space_archive_dialog";
import { useToast } from "@/components/toast_provider/toast_provider";
import { Card, Icon, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import React from "react";
import { useRouter } from "next/navigation";
import { useSelection } from "@/hooks/use_selection";
import { getMassEditBlockReason } from "@/lib/mass_transaction_edit";
import { Tooltip } from "@/components/tooltip/tooltip";

const spaceDetailCache = {
  entries: new Map<string, SpaceDetailPayload>(),
};

interface SpaceDetailSectionProps {
  id: string;
  currentMonthKey: string;
  currentMonthLabel: string;
  previousMonthKey: string;
  nextMonthKey: string;
  page: number;
  isArchiveDialogOpen: boolean;
  isUnarchiveDialogOpen: boolean;
}

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
                  <Text element="p" type="caption" color="hero">
                    {i18n.t("spaces_page.month_total_label", {
                      month: currentMonthLabel,
                    })}
                  </Text>
                  <LoadingSkeleton width="140px" height={38} radius={14} />
                  <Stack line align="center" justify="space-between" gap={12}>
                    <Button
                      href={`/spaces/${id}?currentMonth=${previousMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("pagination.previous"))}
                    >
                      <Icon name="chevron-left" size={18} />
                    </Button>
                    <Text element="p" type="caption-medium" color="hero">
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
                <Text element="p" type="caption" color="hero">
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

function getAccountTypeLabel(space: SpaceDetailPayload["space"]): string {
  return space.type === "credit_card"
    ? String(i18n.t("spaces_page.space_type_credit_card"))
    : String(i18n.t("spaces_page.space_type_regular"));
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
  const { showError } = useToast();
  const router = useRouter();
  const selectionScope = `${id}:${currentMonthKey}`;
  const selection = useSelection<string>(selectionScope);
  const [selectionModeScope, setSelectionModeScope] = React.useState<
    string | null
  >(null);
  const isSelecting = selectionModeScope === selectionScope;
  const endpoint = `/api/spaces/${id}?currentMonth=${currentMonthKey}&page=${String(page)}`;
  const { data, isLoading, hasError, isNotFound, retry } =
    useProtectedPageSection(endpoint, endpoint, spaceDetailCache);
  const [visibleData, setVisibleData] =
    React.useState<SpaceDetailPayload | null>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);

  React.useEffect(() => {
    setVisibleData(data);
  }, [data]);

  if (hasError && !data) {
    return (
      <Container>
        <Card padding={24}>
          <SectionError
            message={i18n.t("spaces_page.detail_load_failed")}
            retryLabel={i18n.t("common.retry")}
            onRetry={retry}
          />
        </Card>
      </Container>
    );
  }

  if (isNotFound) {
    return (
      <Container>
        <Stack gap={24}>
          <Card padding={24}>
            <Text element="p" color="secondary">
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
  const selectedTransactions =
    currentData.selectedMonthRelevantTransactions.filter((transaction) =>
      selection.has(transaction.id),
    );
  const blockReason = getMassEditBlockReason(selectedTransactions);
  function handleMassEdit(): void {
    if (!isSelecting) {
      selection.clear();
      setSelectionModeScope(selectionScope);
      return;
    }
    if (!selectedTransactions.length || blockReason) return;
    const params = new URLSearchParams({
      ids: selectedTransactions.map((transaction) => transaction.id).join(","),
      space: id,
      month: currentMonthKey,
    });
    router.push(`/transactions/mass-edit?${params.toString()}`);
  }
  function cancelSelection(): void {
    selection.clear();
    setSelectionModeScope(null);
  }

  async function handleDownloadPdf(): Promise<void> {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      const month = currentData.selectedMonth.key;
      const response = await fetch(
        `/api/spaces/${encodeURIComponent(currentData.space.id)}/export?currentMonth=${encodeURIComponent(month)}`,
        {
          cache: "no-store",
          credentials: "same-origin",
        },
      );
      if (
        !response.ok ||
        !response.headers.get("Content-Type")?.includes("application/pdf")
      )
        throw new Error("pdf_download_failed");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentData.space.name}-${month}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      showError(i18n.t("spaces_page.pdf_download_failed"));
    } finally {
      setIsDownloadingPdf(false);
    }
  }

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
            <Text element="p" type="caption" color="hero-muted">
              {i18n.t("spaces_page.detail_hero_subtitle", {
                month: currentMonthLabel,
              })}
            </Text>

            <HeroMetrics columns={2}>
              <HeroMetric>
                <Stack gap={16}>
                  <Text element="p" type="caption" color="hero">
                    {i18n.t("spaces_page.month_total_label", {
                      month: currentMonthLabel,
                    })}
                  </Text>
                  <Currency
                    value={currentData.space.selectedMonthTotal}
                    type="h3-bold"
                    color="hero"
                  />
                  <Stack line align="center" justify="space-between" gap={12}>
                    <Button
                      href={`/spaces/${currentData.space.id}?currentMonth=${previousMonthKey}`}
                      variant="outline"
                      ariaLabel={String(i18n.t("pagination.previous"))}
                    >
                      <Icon name="chevron-left" size={18} />
                    </Button>
                    <Text element="p" type="caption-medium" color="hero">
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
                <Text element="p" type="caption" color="hero">
                  {i18n.t("spaces_page.historical_total")}
                </Text>
                <Currency
                  value={currentData.space.historicalTotal}
                  type="h3-bold"
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
              <Stack lineDesktop align="start" justify="space-between" gap={16}>
                <Stack gap={8}>
                  <Text element="p" type="caption-semibold" color="warning">
                    {i18n.t("spaces_page.archived_badge")}
                  </Text>
                  <Text element="p" type="caption" color="secondary">
                    {i18n.t("spaces_page.archived_space_hint")}
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          </Card>
        ) : (
          <Card
            padding={24}
            title={String(i18n.t("space_detail_page.space_details_title"))}
            icon="spaces"
          >
            <Stack gap={20}>
              <DetailList>
                <DetailRow
                  label={
                    <Text element="p" type="caption" color="secondary">
                      {i18n.t("space_detail_page.account_detail_type")}
                    </Text>
                  }
                  value={
                    <Text element="p" type="caption-semibold">
                      {getAccountTypeLabel(currentData.space)}
                    </Text>
                  }
                />
                {currentData.space.members.length > 0 ? (
                  <DetailRow
                    label={
                      <Text element="p" type="caption" color="secondary">
                        {i18n.t("space_members.title")}
                      </Text>
                    }
                    value={
                      <Text element="p" type="caption-semibold">
                        {currentData.space.members
                          .map((member) => member.name)
                          .join(", ")}
                      </Text>
                    }
                  />
                ) : null}
              </DetailList>
            </Stack>
          </Card>
        )}

        <Card
          padding={24}
          title={String(
            i18n.t("spaces_page.month_relevant_transactions_label", {
              month: currentMonthLabel,
            }),
          )}
          icon="transactions"
          actions={
            <Stack line gap={8} align="center" wrap>
              <Button
                variant="secondary"
                size="sm"
                disabled={isDownloadingPdf}
                ariaLabel={String(
                  i18n.t(
                    isDownloadingPdf
                      ? "spaces_page.downloading_pdf"
                      : "spaces_page.download_pdf",
                  ),
                )}
                onClick={() => void handleDownloadPdf()}
                startIcon={<Icon name="download" size={18} />}
              >
                {null}
              </Button>
              {!currentData.space.isArchived ? (
                <Tooltip
                  content={
                    isSelecting && blockReason
                      ? String(i18n.t(blockReason))
                      : null
                  }
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    ariaLabel={String(
                      i18n.t(
                        isSelecting
                          ? "mass_edit.edit_selected"
                          : "mass_edit.start_selection",
                      ),
                    )}
                    disabled={
                      isSelecting &&
                      (!selectedTransactions.length || !!blockReason)
                    }
                    onClick={handleMassEdit}
                    startIcon={<Icon name="edit" size={18} />}
                  >
                    {null}
                  </Button>
                </Tooltip>
              ) : null}
              {isSelecting ? (
                <Button
                  variant="secondary"
                  size="sm"
                  ariaLabel={String(i18n.t("mass_edit.cancel_selection"))}
                  onClick={cancelSelection}
                  startIcon={<Icon name="close" size={18} />}
                >
                  {null}
                </Button>
              ) : null}
            </Stack>
          }
        >
          {isSelecting ? (
            <Text element="p" type="caption" color="secondary">
              {i18n.t("mass_edit.selected_count", {
                count: selectedTransactions.length,
              })}
            </Text>
          ) : null}
          <TransactionList
            transactions={currentData.selectedMonthRelevantTransactions}
            selection={
              isSelecting
                ? { selectedIds: selection.values, onToggle: selection.toggle }
                : undefined
            }
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
                    type="caption-bold"
                  />
                ),
                tone: "emphasis",
              },
              ...currentData.participantGroupTotals.map((member) => ({
                id: `participant-group-${member.id}`,
                label: member.name,
                value: <Currency value={member.amount} type="caption" />,
              })),
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
