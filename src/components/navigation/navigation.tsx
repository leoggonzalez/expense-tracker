import { getCurrentUser } from "@/lib/session";
import { i18n } from "@/model/i18n";

import { NavigationClient } from "./navigation_client";

export async function Navigation(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  const links = currentUser
    ? [
        { href: "/", label: i18n.t("navigation.dashboard") },
        { href: "/projection", label: i18n.t("navigation.projection") },
        { href: "/entries", label: i18n.t("navigation.manage_entries") },
        { href: "/entries/all", label: i18n.t("navigation.all_entries") },
        { href: "/account", label: i18n.t("navigation.account") }
      ]
    : [{ href: "/login", label: i18n.t("navigation.login") }];

  return (
    <NavigationClient
      brandLabel={i18n.t("navigation.brand")}
      links={links}
    />
  );
}
