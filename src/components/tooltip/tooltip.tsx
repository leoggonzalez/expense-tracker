"use client";

import React, { useId, useState } from "react";
import "@/components/tooltip/tooltip.scss";

interface TooltipProps {
  content: string | null;
  children: React.ReactNode;
}

// Shimmer reference inspected 2026-10-26; uses Currento tokens and focus support.
// https://nerdgeschoss.github.io/shimmer-components-static/components/tooltip
export function Tooltip({
  content,
  children,
}: TooltipProps): React.ReactElement {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  return (
    <span
      className="tooltip"
      tabIndex={content ? 0 : undefined}
      aria-describedby={content ? id : undefined}
      onMouseEnter={() => setDismissed(false)}
      onFocus={() => setDismissed(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setDismissed(true);
      }}
    >
      {children}
      {content && !dismissed ? (
        <span id={id} role="tooltip" className="tooltip__content">
          {content}
        </span>
      ) : null}
    </span>
  );
}
