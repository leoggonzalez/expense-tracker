import "./account_card.scss";

import { AppLink, Avatar, Currency } from "@/components";
import { Card, Stack, Text } from "@/elements";

import React from "react";
import { i18n } from "@/model/i18n";

type AccountCardProps = {
  id: string;
  name: string;
  currentMonthTotal: number;
  monthLabel: string;
};

export function AccountCard({
  id,
  name,
  currentMonthTotal,
  monthLabel,
}: AccountCardProps): React.ReactElement {
  return (
    <div className="account-card">
      <AppLink href={`/accounts/${id}`}>
        <div className="account-card__panel">
          <Card padding={24}>
            <Stack gap={20}>
              <div className="account-card__header">
                <Stack direction="row" align="center" gap={12}>
                  <Avatar name={name} />
                  <Text size="lg" weight="semibold">
                    {name}
                  </Text>
                </Stack>
                <Text size="sm" color="secondary">
                  {i18n.t("accounts_page.open_account")}
                </Text>
              </div>

                <Text size="sm" color="secondary">
                  {i18n.t("accounts_page.month_total_label", {
                    month: monthLabel,
                  })}
                </Text>
                <Currency value={currentMonthTotal} size="h4" weight="bold" />
            </Stack>
          </Card>
        </div>
      </AppLink>
    </div>
  );
}
