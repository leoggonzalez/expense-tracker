"use client";

import "./navigation.scss";

import { AppLink, Container, useNavigationProgress } from "@/components";
import { Icon } from "@/elements";
import type { IconName } from "@/elements/icon/icon_assets";
import { i18n } from "@/model/i18n";
import React from "react";
import { usePathname } from "next/navigation";

type NavigationClientProps = {
  isAuthenticated: boolean;
};

export function NavigationClient({
  isAuthenticated,
}: NavigationClientProps): React.ReactElement {
  const pathname = usePathname();
  const { isNavigating, targetHref } = useNavigationProgress();
  const links: Array<{
    href: string;
    label: React.ReactNode;
    icon: IconName;
  }> = isAuthenticated
    ? [
        {
          href: "/",
          label: i18n.t("navigation.dashboard"),
          icon: "dashboard",
        },
        {
          href: "/projection",
          label: i18n.t("navigation.projection"),
          icon: "projection",
        },
        {
          href: "/entries",
          label: i18n.t("navigation.entries"),
          icon: "entries",
        },
        {
          href: "/accounts",
          label: i18n.t("navigation.accounts"),
          icon: "accounts",
        },
        {
          href: "/settings",
          label: i18n.t("navigation.settings"),
          icon: "settings",
        },
      ]
    : [{ href: "/login", label: i18n.t("navigation.login"), icon: "login" }];

  const isLinkActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="navigation">
      <Container maxWidth="wide">
        <div className="navigation__inner">
          <div className="navigation__brand">
            <AppLink href="/">{i18n.t("navigation.brand")}</AppLink>
          </div>
          <ul className="navigation__links">
            {links.map((link) => (
              <li key={link.href} className="navigation__item">
                <div
                  className={[
                    "navigation__link",
                    isLinkActive(link.href) && "navigation__link--active",
                    isNavigating &&
                      targetHref === link.href &&
                      "navigation__link--pending",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <AppLink href={link.href} ariaLabel={String(link.label)}>
                    <span className="navigation__link-content">
                      <span className="navigation__icon">
                        <Icon name={link.icon} size={22} />
                      </span>
                      <span className="navigation__label">{link.label}</span>
                    </span>
                  </AppLink>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </nav>
  );
}
