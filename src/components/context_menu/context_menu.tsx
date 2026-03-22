"use client";

import "./context_menu.scss";

import { Icon } from "@/elements";
import type { IconName } from "@/elements/icon/icon_assets";
import React from "react";

type ContextMenuProps = {
  ariaLabel: string;
  icon: IconName;
  children: React.ReactNode;
};

export function ContextMenu({
  ariaLabel,
  icon,
  children,
}: ContextMenuProps): React.ReactElement {
  const popoverId = React.useId().replaceAll(":", "");
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const supportsPopover =
    typeof HTMLElement !== "undefined" &&
    "showPopover" in HTMLElement.prototype &&
    "hidePopover" in HTMLElement.prototype;

  React.useEffect(() => {
    if (supportsPopover || !isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, supportsPopover]);

  const handleToggle = (): void => {
    if (!supportsPopover) {
      setIsOpen((current) => !current);
      return;
    }

    const popover = popoverRef.current as
      | (HTMLDivElement & {
          hidePopover?: () => void;
          matches: (selectors: string) => boolean;
          showPopover?: () => void;
        })
      | null;

    if (!popover) {
      return;
    }

    if (popover.matches(":popover-open")) {
      popover.hidePopover?.();
      return;
    }

    popover.showPopover?.();
  };

  return (
    <div
      ref={rootRef}
      className={[
        "context-menu",
        !supportsPopover && isOpen && "context-menu--fallback-open",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="context-menu__trigger"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={handleToggle}
      >
        <Icon name={icon} size={18} />
      </button>
      <div
        ref={popoverRef}
        id={popoverId}
        {...(supportsPopover ? { popover: "auto" as const } : {})}
        className="context-menu__popover"
        hidden={!supportsPopover && !isOpen}
      >
        {children}
      </div>
    </div>
  );
}
