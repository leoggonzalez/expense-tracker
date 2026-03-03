"use client";

import Link from "next/link";

import { Icon } from "@/elements";
import { i18n } from "@/model/i18n";

export function FloatingEntryButtonClient(): React.ReactElement {
  return (
    <Link
      href="/entries/new/expense"
      className="floating-entry-button"
      aria-label={i18n.t("common.add_entry") as string}
    >
      <Icon name="plus" size={22} />
    </Link>
  );
}
