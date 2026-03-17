import "./upcoming_payments_panel.scss";

import { AppLink } from "@/components";
import { EntryListItem } from "@/components/entry_list/entry_list";
import { Card, Stack, Text } from "@/elements";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { i18n } from "@/model/i18n";
import React from "react";

type UpcomingPaymentsPanelProps = {
  currentMonthRange: {
    startDate: string;
    endDate: string;
  };
  upcomingPayments: EntryListItem[];
};

function formatPaymentDate(beginDate: string): string {
  return format(new Date(beginDate), "MMM d");
}

export function UpcomingPaymentsPanel({
  currentMonthRange,
  upcomingPayments,
}: UpcomingPaymentsPanelProps): React.ReactElement {
  const currentMonthQuery = `start_date=${currentMonthRange.startDate}&end_date=${currentMonthRange.endDate}`;

  return (
    <Card
      as="section"
      padding={24}
      title={String(i18n.t("dashboard.upcoming_payments"))}
      icon="calendar"
    >
      <Stack gap={20}>
        <div className="upcoming-payments-panel__link">
          <AppLink href={`/entries?${currentMonthQuery}&type=expense`}>
            {i18n.t("dashboard.upcoming_payments_link")}
          </AppLink>
        </div>

        {upcomingPayments.length === 0 ? (
          <div className="upcoming-payments-panel__empty-state">
            <Text color="secondary">
              {i18n.t("dashboard.upcoming_payments_empty")}
            </Text>
          </div>
        ) : (
          <div className="upcoming-payments-panel__list">
            {upcomingPayments.map((entry) => (
              <div key={entry.id} className="upcoming-payments-panel__row">
                <div className="upcoming-payments-panel__copy">
                  <Text as="span" size="sm" weight="semibold">
                    {entry.description}
                  </Text>
                  <Text as="span" size="xs" color="secondary">
                    {entry.accountName}
                  </Text>
                </div>
                <div className="upcoming-payments-panel__meta">
                  <Text as="span" size="sm" weight="semibold">
                    {formatCurrency(Math.abs(entry.amount))}
                  </Text>
                  <Text as="span" size="xs" color="secondary">
                    {i18n.t("dashboard.payment_due", {
                      date: formatPaymentDate(entry.beginDate),
                    })}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </Stack>
    </Card>
  );
}
