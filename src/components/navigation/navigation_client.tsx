"use client";

import "./navigation.scss";

import { Container } from "@/components";
import { Icon } from "@/elements";
import type { IconName } from "@/elements/icon/icon_assets";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

type NavigationClientProps = {
  brandLabel: React.ReactNode;
  links: Array<{
    href: string;
    label: React.ReactNode;
    icon: IconName;
  }>;
};

export function NavigationClient({
  brandLabel,
  links,
}: NavigationClientProps): React.ReactElement {
  const pathname = usePathname();
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
            <Link href="/">{brandLabel}</Link>
          </div>
          <ul className="navigation__links">
            {links.map((link) => (
              <li key={link.href} className="navigation__item">
                <Link
                  href={link.href}
                  aria-label={String(link.label)}
                  className={`navigation__link ${
                    isLinkActive(link.href) ? "navigation__link--active" : ""
                  }`}
                >
                  <Icon
                    name={link.icon}
                    size={22}
                    className="navigation__icon"
                  />
                  <span className="navigation__label">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </nav>
  );
}
