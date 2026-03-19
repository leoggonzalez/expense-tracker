import "./entry_creation_intro.scss";

import { Grid, Stack, Text } from "@/elements";

import { HeroMetric } from "@/components/hero_metrics/hero_metrics";
import React from "react";
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
      <Text size="sm" as="p" color="inverse">
        {subtitle}
      </Text>
    </div>
  );
}
