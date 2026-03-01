import "./floating_entry_button.scss";

import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { Icon } from "@/elements";
import { i18n } from "@/model/i18n";

export async function FloatingEntryButton(): Promise<React.ReactElement | null> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  return (
    <Link
      href="/entries/new/income"
      className="floating-entry-button"
      aria-label={i18n.t("common.add_entry") as string}
    >
      <Icon name="plus" size={22} />
    </Link>
  );
}
