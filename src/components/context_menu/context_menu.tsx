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
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const supportsPopover =
    typeof HTMLElement !== "undefined" &&
    "showPopover" in HTMLElement.prototype &&
    "hidePopover" in HTMLElement.prototype;
  const supportsAnchorPositioning =
    typeof CSS !== "undefined" &&
    CSS.supports("top: anchor(bottom)") &&
    CSS.supports("position-anchor: --context-menu-anchor");
  const useNativePopover = supportsPopover && supportsAnchorPositioning;

  const updateManualPosition = React.useCallback((): void => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;

    if (!trigger || !popover) {
      return;
    }

    const viewportPadding = 12;
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const measuredWidth = popoverRect.width || 420;
    const measuredHeight = popoverRect.height || 0;
    const maxLeft = window.innerWidth - viewportPadding - measuredWidth;
    const anchoredLeft = triggerRect.right - measuredWidth;
    const left = Math.max(viewportPadding, Math.min(anchoredLeft, maxLeft));
    const belowTop = triggerRect.bottom + 8;
    const fitsBelow =
      belowTop + measuredHeight <= window.innerHeight - viewportPadding;
    const top = fitsBelow
      ? belowTop
      : Math.max(viewportPadding, triggerRect.top - measuredHeight - 8);

    popover.style.setProperty("--context-menu-top", `${top}px`);
    popover.style.setProperty("--context-menu-left", `${left}px`);
  }, []);

  React.useEffect(() => {
    if (useNativePopover || !isOpen) {
      return;
    }

    updateManualPosition();

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

    const handleReposition = (): void => {
      updateManualPosition();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updateManualPosition, useNativePopover]);

  const handleToggle = (): void => {
    if (!useNativePopover) {
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
        !useNativePopover && isOpen && "context-menu--fallback-open",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        ref={triggerRef}
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
        {...(useNativePopover ? { popover: "auto" as const } : {})}
        className={[
          "context-menu__popover",
          !useNativePopover && "context-menu__popover--manual-position",
        ]
          .filter(Boolean)
          .join(" ")}
        hidden={!useNativePopover && !isOpen}
      >
        {children}
      </div>
    </div>
  );
}
