"use client";

import { AppLink } from "@/components";
import { Icon } from "@/elements";
import { i18n } from "@/model/i18n";

export function FloatingEntryButtonClient(): React.ReactElement {
  return (
    <div className="floating-entry-button">
      <AppLink
        href="/entries/new/expense"
        aria-label={i18n.t("common.add_entry") as string}
      >
        <span className="floating-entry-button__surface">
          <Icon name="plus" size={22} />
        </span>
      </AppLink>
    </div>
  );
}
