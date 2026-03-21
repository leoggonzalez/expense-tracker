import "./hero.scss";

import { Button } from "@/components/button/button";
import type { ButtonProps } from "@/components/button/button";
import { Icon, Stack, Text } from "@/elements";

import type { IconName } from "@/elements/icon/icon_assets";
import React from "react";

export type HeroPattern =
  | "dashboard"
  | "projection"
  | "transactions"
  | "spaces"
  | "space_detail"
  | "space_form"
  | "transaction_detail"
  | "new_transaction"
  | "space"
  | "settings";

export type HeroProps = {
  icon: IconName;
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: HeroAction[];
  pattern: HeroPattern;
};

export type HeroAction = {
  icon: IconName;
  title?: string;
  ariaLabel: string;
  href: string;
  variant: NonNullable<ButtonProps["variant"]>;
  disabled?: boolean;
};

export function Hero({
  icon,
  title,
  children,
  actions,
  pattern,
}: HeroProps): React.ReactElement {
  const classes = ["hero", `hero--pattern-${pattern}`].join(" ");

  return (
    <section className={classes}>
      <div className="hero__header">
        <div className="hero__title-row">
          <Stack direction="row" align="center" gap={12}>
            <span className="hero__icon">
              <Icon name={icon} size={20} />
            </span>
            <div className="hero__title">
              <Text size="h3" color="hero">
                {title}
              </Text>
            </div>
          </Stack>
        </div>

        {actions && actions.length > 0 ? (
          <div className="hero__actions">
            {actions.map((action) => (
              <Button
                key={`${action.href}-${action.ariaLabel}`}
                href={action.href}
                variant={action.variant}
                size="sm"
                ariaLabel={action.ariaLabel}
                disabled={action.disabled}
                startIcon={<Icon name={action.icon} size={16} />}
              >
                {action.title ?? null}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="hero__body">{children}</div>
    </section>
  );
}
