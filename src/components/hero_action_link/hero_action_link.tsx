import "./hero_action_link.scss";

import React from "react";

import { AppLink } from "@/components/app_link/app_link";

type HeroActionLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "primary";
};

export function HeroActionLink({
  href,
  children,
  variant = "default",
}: HeroActionLinkProps): React.ReactElement {
  return (
    <AppLink href={href}>
      <span className={`hero-action-link hero-action-link--${variant}`}>
        {children}
      </span>
    </AppLink>
  );
}
