import "./account_card.scss";

import React from "react";

import { AppLink } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type AccountCardProps = {
  id: string;
  name: string;
  entryCount: number;
  allTimeNet: number;
};

function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  return `${sign}${absAmount.toFixed(2)} €`;
}

export function AccountCard({
  id,
  name,
  entryCount,
  allTimeNet,
}: AccountCardProps): React.ReactElement {
  return (
    <div className="account-card">
      <AppLink href={`/accounts/${id}`}>
        <div className="account-card__panel">
          <Card padding={20}>
            <Stack gap={10}>
              <Text size="lg" weight="semibold">
                {name}
              </Text>
              <div className="account-card__meta">
                <Stack gap={4}>
                  <Text size="xs" color="secondary">
                    {i18n.t("accounts_page.total_balance")}
                  </Text>
                  <Text
                    size="lg"
                    weight="bold"
                    color={allTimeNet >= 0 ? "success" : "danger"}
                  >
                    {formatCurrency(allTimeNet)}
                  </Text>
                </Stack>
              </div>
              <Text size="sm" color="secondary">
                {i18n.t("accounts_page.entry_count", { count: entryCount })}
              </Text>
            </Stack>
          </Card>
        </div>
      </AppLink>
    </div>
  );
}
