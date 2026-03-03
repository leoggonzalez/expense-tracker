import "./floating_entry_button.scss";

import { getCurrentUser } from "@/lib/session";
import { FloatingEntryButtonClient } from "@/components/floating_entry_button/floating_entry_button_client";

export async function FloatingEntryButton(): Promise<React.ReactElement | null> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  return <FloatingEntryButtonClient />;
}
