import "./transaction_creation_intro.scss";

import { Text } from "@/elements";

import React from "react";

type TransactionCreationIntroProps = {
  pageType?: "income" | "expense" | "transfer" | "multiple";
  subtitle: React.ReactNode;
};

export function TransactionCreationIntro({
  subtitle,
}: TransactionCreationIntroProps): React.ReactElement {
  return (
    <div className="transaction-creation-intro">
      <Text size="sm" as="p" color="hero-muted">
        {subtitle}
      </Text>
    </div>
  );
}
