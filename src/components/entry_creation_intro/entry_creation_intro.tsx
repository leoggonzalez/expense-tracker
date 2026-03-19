import "./entry_creation_intro.scss";

import { Text } from "@/elements";

import React from "react";

type EntryCreationIntroProps = {
  subtitle: React.ReactNode;
};

export function EntryCreationIntro({
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
