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
  }>;
};

export function NavigationClient({
  brandLabel,
  links,
}: NavigationClientProps): React.ReactElement {
  const pathname = usePathname();

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
