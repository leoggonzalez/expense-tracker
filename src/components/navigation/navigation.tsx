"use client";

import "./navigation.scss";

import { Container } from "@/components";
import { i18n } from "@/model/i18n";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

export function Navigation(): React.ReactElement {
  const pathname = usePathname();

  const links = [
    { href: "/", label: String(i18n.t("navigation.dashboard")) },
    { href: "/projection", label: String(i18n.t("navigation.projection")) },
    { href: "/entries", label: String(i18n.t("navigation.manage_entries")) },
    { href: "/entries/all", label: String(i18n.t("navigation.all_entries")) },
  ];

  return (
    <nav className="navigation">
      <Container maxWidth="full">
        <div className="navigation__inner">
          <div className="navigation__brand">
            <Link href="/">{String(i18n.t("navigation.brand"))}</Link>
          </div>
          <ul className="navigation__links">
            {links.map((link) => (
              <li key={link.href} className="navigation__item">
                <Link
                  href={link.href}
                  className={`navigation__link ${
                    pathname === link.href ? "navigation__link--active" : ""
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </nav>
  );
}
