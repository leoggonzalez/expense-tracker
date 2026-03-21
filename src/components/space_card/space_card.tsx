import "./space_card.scss";

import { Avatar, Button, Currency } from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";

import React from "react";
import { i18n } from "@/model/i18n";

type SpaceCardProps = {
  id: string;
  name: string;
  currentMonthTotal: number;
  monthLabel: string;
};

export function SpaceCard({
  id,
  name,
  currentMonthTotal,
  monthLabel,
}: SpaceCardProps): React.ReactElement {
  return (
    <div className="space-card">
      <div className="space-card__panel">
        <Card padding={24} radius={28} fullHeight>
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
                href={`/spaces/${id}`}
                variant="secondary"
                size="sm"
                startIcon={<Icon name="external-link" size={16} />}
                ariaLabel={String(i18n.t("spaces_page.open_space"))}
              >
                <span className="space-card__sr-only">
                  {i18n.t("spaces_page.open_space")}
                </span>
              </Button>
            </Stack>

            <Text size="sm" color="secondary">
              {i18n.t("spaces_page.month_total_label", {
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
