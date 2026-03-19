import "./card.scss";

import React from "react";

import { Box, BoxPadding } from "@/elements/box/box";
import { Icon } from "@/elements/icon/icon";
import type { IconName } from "@/elements/icon/icon_assets";
import { Text } from "@/elements/text/text";

export interface CardProps {
  children: React.ReactNode;
  padding?: number | BoxPadding;
  variant?: "default" | "secondary" | "dashed";
  as?: "div" | "section" | "article";
  title?: string;
  icon?: IconName;
  actions?: React.ReactNode;
}

export function Card({
  children,
  padding,
  variant = "default",
  as: Component = "div",
  title,
  icon,
  actions,
}: CardProps): React.ReactElement {
  const classes = ["card", `card--${variant}`].join(" ");

  return (
    <Component className={classes}>
      <Box padding={padding}>
        {title || icon || actions ? (
          <div className="card__header">
            <div className="card__title-group">
              {icon ? (
                <span className="card__icon">
                  <Icon name={icon} size={18} />
                </span>
              ) : null}
              {title ? (
                <Text as="span" size="lg" weight="semibold">
                  {title}
                </Text>
              ) : null}
            </div>
            {actions ? <div className="card__actions">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </Box>
    </Component>
  );
}
