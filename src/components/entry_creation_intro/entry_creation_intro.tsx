import "./entry_creation_intro.scss";

import React from "react";

import { HeroMetric } from "@/components/hero_metrics/hero_metrics";
import { Grid, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type EntryCreationIntroProps = {
  pageType: "income" | "expense" | "transfer" | "multiple";
  subtitle: React.ReactNode;
};

export function EntryCreationIntro({
  pageType,
  subtitle,
}: EntryCreationIntroProps): React.ReactElement {
  return (
    <div className="entry-creation-intro">
      <Stack gap={12}>
        <Text
          size="sm"
          as="p"
          weight="semibold"
          color="inverse"
          transform="uppercase"
        >
          {i18n.t("navigation.entries")}
        </Text>
        <Text size="sm" as="p" color="inverse">
          {subtitle}
        </Text>
      </Stack>

      <div className="entry-creation-intro__metrics">
        <Grid columns="repeat(2, minmax(0, 1fr))" gap={12}>
          <HeroMetric>
            <Stack gap={4}>
              <Text size="xs" weight="semibold" color="inverse">
                {i18n.t("common.income")}
              </Text>
              <Text size="lg" weight="semibold" color="inverse">
                {i18n.t("new_entry_page.income_tab")}
              </Text>
            </Stack>
          </HeroMetric>
          <HeroMetric>
            <Stack gap={4}>
              <Text size="xs" weight="semibold" color="inverse">
                {i18n.t("common.expense")}
              </Text>
              <Text size="lg" weight="semibold" color="inverse">
                {pageType === "transfer"
                  ? i18n.t("new_entry_page.transfer_tab")
                  : i18n.t("entry_form.schedule_label")}
              </Text>
            </Stack>
          </HeroMetric>
        </Grid>
      </div>
    </div>
  );
}
