"use client";

import { SectionError } from "@/components/section_error/section_error";

import type { ProjectionSpacesPayload } from "@/actions/transactions";
import { useProtectedPageSection } from "@/app/(protected)/use_protected_page_section";
import {
  Button,
  Currency,
  LoadingSkeleton,
  TransactionList,
} from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

const projectionSpacesCache = {
  entries: new Map<string, ProjectionSpacesPayload>(),
};

interface ProjectionSpacesProps {
  monthKey: string;
}

function ProjectionSpaceCardSkeleton(): React.ReactElement {
  return (
    <Card padding={24}>
      <Stack gap={18}>
        <Stack gap={8}>
          <LoadingSkeleton width="180px" height={24} radius={12} />
          <LoadingSkeleton width="100px" height={18} radius={10} />
        </Stack>
        <LoadingSkeleton width="100%" height={84} radius={18} />
      </Stack>
    </Card>
  );
}

export function ProjectionSpaces({
  monthKey,
}: ProjectionSpacesProps): React.ReactElement {
  const endpoint = `/api/projection/spaces?month=${monthKey}`;
  const { data, isLoading, hasError, retry } = useProtectedPageSection(
    endpoint,
    endpoint,
    projectionSpacesCache,
  );
  const resolvedMonthKey = data?.focusedMonthKey || monthKey;

  return (
    <Stack gap={16}>
      <Text type="h4-semibold" element="h3">
        {i18n.t("projection_page.spaces_with_transactions")}
      </Text>

      {hasError && !data ? (
        <SectionError
          message={i18n.t("projection_page.spaces_load_failed")}
          retryLabel={i18n.t("common.retry")}
          onRetry={retry}
        />
      ) : isLoading && !data ? (
        <Stack gap={24}>
          <ProjectionSpaceCardSkeleton />
          <ProjectionSpaceCardSkeleton />
        </Stack>
      ) : data && data.focusedMonthSpaces.length === 0 ? (
        <Card padding={24} variant="dashed">
          <Text element="p" color="secondary">
            {i18n.t("projection_page.empty_month_transactions")}
          </Text>
        </Card>
      ) : (
        <Stack gap={24}>
          {data?.focusedMonthSpaces.map((space) => {
            const hiddenTransactionsCount = Math.max(
              0,
              space.monthTransactionCount - space.transactions.length,
            );
            const spaceMonthHref = `/spaces/${space.spaceId}?currentMonth=${resolvedMonthKey}`;

            return (
              <Card
                key={space.spaceId}
                as="section"
                padding={24}
                title={space.spaceName}
                icon="spaces"
                actions={
                  <Button
                    href={spaceMonthHref}
                    variant="secondary"
                    size="sm"
                    startIcon={<Icon name="external-link" size={16} />}
                    ariaLabel={String(i18n.t("projection_page.open_space"))}
                  >
                    {null}
                  </Button>
                }
              >
                <TransactionList
                  transactions={space.transactions}
                  showDelete={false}
                  transactionHrefBase="/transactions"
                  summaryRows={[
                    ...(hiddenTransactionsCount > 0
                      ? [
                          {
                            id: `more-${space.spaceId}`,
                            label: i18n.t(
                              "projection_page.more_transactions_this_month",
                              {
                                count: hiddenTransactionsCount,
                              },
                            ) as string,
                            href: spaceMonthHref,
                          },
                        ]
                      : []),
                    {
                      id: `total-${space.spaceId}`,
                      label: i18n.t(
                        "projection_page.space_month_total",
                      ) as string,
                      value: (
                        <Currency
                          value={space.monthTotal}
                          type="caption-bold"
                        />
                      ),
                      tone: "emphasis",
                    },
                    ...space.memberTotals.map((member) => ({
                      id: `member-${member.id}`,
                      label: member.isOwner
                        ? i18n.t("transaction_split.you")
                        : member.isRemoved
                          ? i18n.t("space_members.former", {
                              name: member.name,
                            })
                          : member.name,
                      value: <Currency value={member.amount} type="caption" />,
                    })),
                  ]}
                />
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
