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

  return (
    <div className="context-menu">
      <button
        type="button"
        className="context-menu__trigger"
        aria-label={ariaLabel}
        popoverTarget={popoverId}
      >
        <Icon name={icon} size={18} />
      </button>
      <div id={popoverId} popover="auto" className="context-menu__popover">
        {children}
      </div>
    </div>
  );
}
