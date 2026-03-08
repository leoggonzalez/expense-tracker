import "./account_card.scss";

import React from "react";

import { AppLink, Currency } from "@/components";
import { Card, Stack, Text } from "@/elements";
import { i18n } from "@/model/i18n";

type AccountCardProps = {
  id: string;
  name: string;
  entryCount: number;
  allTimeNet: number;
};

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
                  <Currency value={allTimeNet} size="lg" weight="bold" />
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
