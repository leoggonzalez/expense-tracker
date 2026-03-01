"use client";

import "./navigation.scss";

import { Container } from "@/components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type NavigationClientProps = {
  brandLabel: React.ReactNode;
  links: Array<{
    href: string;
    label: React.ReactNode;
    icon:
      | "dashboard"
      | "projection"
      | "entries"
      | "accounts"
      | "settings"
      | "login";
  }>;
};

function NavigationIcon({
  icon,
}: {
  icon: NavigationClientProps["links"][number]["icon"];
}): React.ReactElement {
  switch (icon) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="navigation__icon">
          <path d="M3 13.5h8V21H3zm10-10h8v17h-8zM3 3h8v8H3z" />
        </svg>
      );
    case "projection":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="navigation__icon">
          <path d="M4 19h16v2H2V3h2zm2-3 3.5-4 3 2 4.5-6L20 10v3l-3-2.5-4.5 6-3-2-2.5 3z" />
        </svg>
      );
    case "entries":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="navigation__icon">
          <path d="M5 4h14v2H5zm0 6h14v2H5zm0 6h14v2H5z" />
        </svg>
      );
    case "accounts":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="navigation__icon">
          <path d="M3 6h18a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1zm0 3v8h18V9zm12 3h4v2h-4z" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="navigation__icon">
          <path d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94 7.43 7.43 0 0 0-.05-.94l2.03-1.58-1.92-3.32-2.39.96a7.2 7.2 0 0 0-1.63-.94L14.96 2h-3.92l-.27 2.18c-.58.22-1.12.53-1.63.94l-2.39-.96-1.92 3.32 2.03 1.58c-.03.31-.05.63-.05.94s.02.63.05.94l-2.03 1.58 1.92 3.32 2.39-.96c.51.41 1.05.72 1.63.94L11.04 22h3.92l.27-2.18c.58-.22 1.12-.53 1.63-.94l2.39.96 1.92-3.32zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
        </svg>
      );
    case "login":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="navigation__icon">
          <path d="M10 17v-3H3v-4h7V7l5 5zm2-14h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7v-2h7V5h-7z" />
        </svg>
      );
  }
}

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
      <Container maxWidth="full">
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
                  <NavigationIcon icon={link.icon} />
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
