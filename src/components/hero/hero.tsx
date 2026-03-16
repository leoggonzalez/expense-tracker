import "./hero.scss";

import React from "react";

import { Icon, Stack } from "@/elements";
import type { IconName } from "@/elements/icon/icon_assets";

export type HeroPattern =
  | "dashboard"
  | "projection"
  | "entries"
  | "accounts"
  | "account_detail"
  | "account_form"
  | "entry_detail"
  | "new_entry"
  | "account"
  | "settings";

export type HeroProps = {
  icon: IconName;
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  pattern: HeroPattern;
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
            <div className="hero__title">{title}</div>
          </Stack>
        </div>

        {actions ? <div className="hero__actions">{actions}</div> : null}
      </div>

      <div className="hero__body">{children}</div>
    </section>
  );
}
