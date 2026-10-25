import "@/components/space_card/space_card.scss";

import { AppLink, Avatar, Button, Currency } from "@/components";
import { Card, Icon, Stack, Text } from "@/elements";

import { i18n } from "@/model/i18n";
import React from "react";

interface SpaceCardProps {
  id: string;
  name: string;
  currentMonthTotal: number;
  monthLabel: string;
}

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
            <Stack line align="center" justify="space-between" gap={16}>
              <Stack line align="center" gap={12}>
                <AppLink href={`/spaces/${id}`} ariaLabel={name}>
                  <Avatar name={name} />
                </AppLink>
                <AppLink href={`/spaces/${id}`}>
                  <Text element="p" type="lead-semibold">
                    {name}
                  </Text>
                </AppLink>
              </Stack>
              <Button
                href={`/spaces/${id}`}
                target="_blank"
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

            <Text element="p" type="caption" color="secondary">
              {i18n.t("spaces_page.month_total_label", {
                month: monthLabel,
              })}
            </Text>
            <Currency value={currentMonthTotal} type="h4-bold" />
          </Stack>
        </Card>
      </div>
    </div>
  );
}
