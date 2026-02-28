"use client";

import "./navigation.scss";

import { Container } from "@/components";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

export function Navigation(): React.ReactElement {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/projection", label: "Projection" },
    { href: "/entries", label: "Manage Entries" },
    { href: "/entries/all", label: "All Entries" },
  ];

  return (
    <nav className="navigation">
      <Container maxWidth="full">
        <div className="navigation__inner">
          <div className="navigation__brand">
            <Link href="/">Expense Tracker</Link>
          </div>
          <ul className="navigation__links">
            {links.map((link) => (
              <li key={link.href} className="navigation__item">
                <Link
                  href={link.href}
                  className={`navigation__link ${pathname === link.href ? "navigation__link--active" : ""
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
