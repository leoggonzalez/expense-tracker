"use client";

import Link from "next/link";
import React from "react";
import { useNavigationProgress } from "@/components/navigation_progress_provider/navigation_progress_provider";

type AppLinkProps = {
  href: string;
  children: React.ReactNode;
  ariaLabel?: string;
};

function isModifiedEvent(event: React.MouseEvent<HTMLAnchorElement>): boolean {
  return (
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.button !== 0
  );
}

export function AppLink({
  href,
  children,
  ariaLabel,
}: AppLinkProps): React.ReactElement {
  const { push } = useNavigationProgress();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (
      event.defaultPrevented ||
      isModifiedEvent(event) ||
      href.startsWith("#")
    ) {
      return;
    }

    event.preventDefault();
    push(href);
  };

  return (
    <Link href={href} aria-label={ariaLabel} onClick={handleClick}>
      {children}
    </Link>
  );
}
