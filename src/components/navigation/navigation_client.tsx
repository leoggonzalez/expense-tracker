"use client";

import "./navigation.scss";

import {
  AppLink,
  Avatar,
  Container,
  useNavigationProgress,
} from "@/components";
import { Icon, Text } from "@/elements";
import type { IconName } from "@/elements/icon/icon_assets";
import { CurrentoLogo } from "@/lib/currento_logo";
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

type NavigationLink = {
  href: string;
  label: React.ReactNode;
  icon: IconName;
  isMobilePrimary?: boolean;
  matchesPath?: (pathname: string) => boolean;
};

export function NavigationClient({
  isAuthenticated,
  currentUser,
}: NavigationClientProps): React.ReactElement {
  const pathname = usePathname();
  const { isNavigating, targetHref } = useNavigationProgress();
  const allLinks: NavigationLink[] = isAuthenticated
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
          href: "/spaces",
          label: i18n.t("navigation.spaces"),
          icon: "spaces",
        },
        {
          href: "/settings",
          label: i18n.t("navigation.settings"),
          icon: "settings",
        },
      ]
    : [{ href: "/login", label: i18n.t("navigation.login"), icon: "login" }];
  const mobileLinks: NavigationLink[] = isAuthenticated
    ? [
        allLinks[0],
        allLinks[1],
        {
          href: "/entries/new/expense",
          label: i18n.t("common.add_entry"),
          icon: "plus",
          isMobilePrimary: true,
          matchesPath: (currentPathname) =>
            currentPathname.startsWith("/entries/new"),
        },
        allLinks[2],
        allLinks[3],
      ]
    : allLinks;
  const primaryLinks = isAuthenticated ? allLinks.slice(0, 4) : allLinks;
  const secondaryLinks = isAuthenticated ? allLinks.slice(4) : [];
  const displayName =
    currentUser?.name || String(i18n.t("navigation.user_fallback_name"));

  const isLinkActive = (link: NavigationLink): boolean => {
    if (link.matchesPath) {
      return link.matchesPath(pathname);
    }

    const { href } = link;

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
                <span className="navigation__logo">
                  <CurrentoLogo size={36} />
                </span>
                <span className="navigation__brand-label">
                  {i18n.t("navigation.brand")}
                </span>
              </span>
            </AppLink>
          </div>

          <div className="navigation__sections">
            <ul className="navigation__links navigation__links--mobile">
              {mobileLinks.map((link) => (
                <li key={link.href} className="navigation__item">
                  <div
                    className={[
                      "navigation__link",
                      isLinkActive(link) && "navigation__link--active",
                      link.isMobilePrimary &&
                        "navigation__link--mobile-primary",
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
                          <Icon
                            name={link.icon}
                            size={link.isMobilePrimary ? 24 : 20}
                          />
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
                        isLinkActive(link) && "navigation__link--active",
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
                          isLinkActive(link) && "navigation__link--active",
                          isNavigating &&
                            targetHref === link.href &&
                            "navigation__link--pending",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <AppLink
                          href={link.href}
                          ariaLabel={String(link.label)}
                        >
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
              <AppLink href="/account" ariaLabel={displayName}>
                <span className="navigation__user-card-link">
                  <span className="navigation__user-avatar">
                    <Avatar name={displayName} />
                  </span>
                  <span className="navigation__user-copy">
                    <Text as="span" size="sm" weight="semibold">
                      {displayName}
                    </Text>
                    <Text as="span" size="xs" color="secondary">
                      {currentUser.email}
                    </Text>
                  </span>
                </span>
              </AppLink>
            </div>
          ) : null}
        </div>
      </Container>
    </nav>
  );
}
