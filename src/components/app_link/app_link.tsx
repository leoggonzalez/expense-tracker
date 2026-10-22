"use client";

import { useNavigationProgress } from "@/components/navigation_progress_provider/navigation_progress_provider";
import Link from "next/link";
import React from "react";

interface AppLinkProps {
  href: string;
  children: React.ReactNode;
  ariaLabel?: string;
  target?: "_blank" | "_self";
}

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
  target,
}: AppLinkProps): React.ReactElement {
  const { push } = useNavigationProgress();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (
      target === "_blank" ||
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
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
