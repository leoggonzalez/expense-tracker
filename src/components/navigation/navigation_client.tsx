"use client";

import "./navigation.scss";

import { AppLink, Avatar, Container, useNavigationProgress } from "@/components";
import { Icon, Text } from "@/elements";
import type { IconName } from "@/elements/icon/icon_assets";
import { i18n } from "@/model/i18n";
import React from "react";
import { usePathname } from "next/navigation";

type NavigationClientProps = {
  isAuthenticated: boolean;
  currentUser: {
    email: string;
    name: string | null;
  } | null;
};

function SequenceLogo(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="navigation__logo"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 4h14c0 7.732-6.268 14-14 14V4Z"
        fill="currentColor"
      />
      <path
        d="M30 4h14v14c-7.732 0-14-6.268-14-14Z"
        fill="currentColor"
      />
      <path
        d="M4 30c7.732 0 14 6.268 14 14H4V30Z"
        fill="currentColor"
      />
      <path
        d="M44 44H30c0-7.732 6.268-14 14-14v14Z"
        fill="currentColor"
      />
      <circle cx="24" cy="24" r="7" fill="currentColor" />
    </svg>
  );
}

export function NavigationClient({
  isAuthenticated,
  currentUser,
}: NavigationClientProps): React.ReactElement {
  const pathname = usePathname();
  const { isNavigating, targetHref } = useNavigationProgress();
  const allLinks: Array<{
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
  const primaryLinks = isAuthenticated ? allLinks.slice(0, 4) : allLinks;
  const secondaryLinks = isAuthenticated ? allLinks.slice(4) : [];
  const displayName =
    currentUser?.name || String(i18n.t("navigation.user_fallback_name"));

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
            <AppLink href="/">
              <span className="navigation__brand-link">
                <SequenceLogo />
                <span className="navigation__brand-label">
                  {i18n.t("navigation.brand")}
                </span>
              </span>
            </AppLink>
          </div>

          <div className="navigation__sections">
            <ul className="navigation__links navigation__links--mobile">
              {allLinks.map((link) => (
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
                          <Icon name={link.icon} size={20} />
                        </span>
                        <span className="navigation__label">{link.label}</span>
                      </span>
                    </AppLink>
                  </div>
                </li>
              ))}
            </ul>

            <div className="navigation__section">
              <Text
                as="span"
                size="xs"
                color="secondary"
                weight="medium"
                transform="uppercase"
              >
                {i18n.t("navigation.primary_section")}
              </Text>
              <ul className="navigation__links navigation__links--desktop">
                {primaryLinks.map((link) => (
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
                            <Icon name={link.icon} size={20} />
                          </span>
                          <span className="navigation__label">{link.label}</span>
                        </span>
                      </AppLink>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {secondaryLinks.length > 0 ? (
              <div className="navigation__section navigation__section--secondary">
                <Text
                  as="span"
                  size="xs"
                  color="secondary"
                  weight="medium"
                  transform="uppercase"
                >
                  {i18n.t("navigation.secondary_section")}
                </Text>
                <ul className="navigation__links navigation__links--desktop">
                  {secondaryLinks.map((link) => (
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
                              <Icon name={link.icon} size={20} />
                            </span>
                            <span className="navigation__label">
                              {link.label}
                            </span>
                          </span>
                        </AppLink>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {currentUser ? (
            <div className="navigation__user-card">
              <div className="navigation__user-avatar">
                <Avatar name={displayName} />
              </div>
              <div className="navigation__user-copy">
                <Text as="span" size="sm" weight="semibold">
                  {displayName}
                </Text>
                <Text as="span" size="xs" color="secondary">
                  {currentUser.email}
                </Text>
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </nav>
  );
}
