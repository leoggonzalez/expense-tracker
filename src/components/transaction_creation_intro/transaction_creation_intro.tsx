import "@/components/transaction_creation_intro/transaction_creation_intro.scss";

import { Text } from "@/elements";

import React from "react";

interface TransactionCreationIntroProps {
  pageType?: "income" | "expense" | "transfer" | "multiple";
  subtitle: React.ReactNode;
}

export function TransactionCreationIntro({
  subtitle,
}: TransactionCreationIntroProps): React.ReactElement {
  return (
    <div className="transaction-creation-intro">
      <Text type="caption" element="p" color="hero-muted">
        {subtitle}
      </Text>
    </div>
  );
}
