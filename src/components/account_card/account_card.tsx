import "./account_card.scss";

import { Avatar, Button, Currency } from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";

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
      <div className="account-card__panel">
        <Card padding={24}>
          <Stack gap={20}>
            <Stack
              direction="row"
              align="center"
              justify="space-between"
              gap={16}
            >
              <Stack direction="row" align="center" gap={12}>
                <Avatar name={name} />
                <Text size="lg" weight="semibold">
                  {name}
                </Text>
              </Stack>
              <Button
                href={`/accounts/${id}`}
                variant="secondary"
                size="sm"
                startIcon={<Icon name="external-link" size={16} />}
                ariaLabel={String(i18n.t("accounts_page.open_account"))}
              >
                <span className="account-card__sr-only">
                  {i18n.t("accounts_page.open_account")}
                </span>
              </Button>
            </Stack>

            <Text size="sm" color="secondary">
              {i18n.t("accounts_page.month_total_label", {
                month: monthLabel,
              })}
            </Text>
            <Currency value={currentMonthTotal} size="h4" weight="bold" />
          </Stack>
        </Card>
      </div>
    </div>
  );
}
