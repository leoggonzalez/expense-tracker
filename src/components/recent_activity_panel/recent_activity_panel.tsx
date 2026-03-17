import "./recent_activity_panel.scss";

import { AppLink, EntryList, EntryListItem } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";
import React from "react";

type RecentActivityPanelProps = {
  currentMonthRange: {
    startDate: string;
    endDate: string;
  };
  recentEntries: EntryListItem[];
};

export function RecentActivityPanel({
  currentMonthRange,
  recentEntries,
}: RecentActivityPanelProps): React.ReactElement {
  const currentMonthQuery = `start_date=${currentMonthRange.startDate}&end_date=${currentMonthRange.endDate}`;

  return (
    <Card
      as="section"
      padding={24}
      title={String(i18n.t("dashboard.recent_entries"))}
      icon="activity"
    >
      <Stack gap={20}>
        <Text size="sm" color="secondary">
          {i18n.t("dashboard.activity_subtitle")}
        </Text>
        <div className="recent-activity-panel__link">
          <AppLink href={`/entries?${currentMonthQuery}`}>
            {i18n.t("dashboard.recent_activity_link")}
          </AppLink>
        </div>
        <EntryList
          entries={recentEntries}
          showDelete={false}
          entryHrefBase="/entries"
        />
      </Stack>
    </Card>
  );
}
