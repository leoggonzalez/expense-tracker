'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Navigation.scss';

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/projection', label: 'Projection' },
    { href: '/entries', label: 'Manage Entries' },
  ];

  return (
    <nav className="navigation">
      <div className="navigation__container">
        <div className="navigation__brand">
          <Link href="/">Expense Tracker</Link>
        </div>
        <ul className="navigation__links">
          {links.map((link) => (
            <li key={link.href} className="navigation__item">
              <Link
                href={link.href}
                className={`navigation__link ${
                  pathname === link.href ? 'navigation__link--active' : ''
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
