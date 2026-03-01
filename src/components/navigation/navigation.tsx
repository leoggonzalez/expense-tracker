import { getCurrentUser } from "@/lib/session";
import { i18n } from "@/model/i18n";
import type { IconName } from "@/elements/icon/icon_assets";

import { NavigationClient } from "./navigation_client";

export async function Navigation(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  type NavigationLink = {
    href: string;
    label: React.ReactNode;
    icon: IconName;
  };

  const links: NavigationLink[] = currentUser
    ? [
        {
          href: "/",
          label: i18n.t("navigation.dashboard"),
          icon: "dashboard",
        },
        {
          href: "/projection",
          label: i18n.t("navigation.projection"),
          icon: "projection",
        },
        {
          href: "/entries",
          label: i18n.t("navigation.entries"),
          icon: "entries",
        },
        {
          href: "/accounts",
          label: i18n.t("navigation.accounts"),
          icon: "accounts",
        },
        {
          href: "/settings",
          label: i18n.t("navigation.settings"),
          icon: "settings",
        },
      ]
    : [{ href: "/login", label: i18n.t("navigation.login"), icon: "login" }];

  return (
    <NavigationClient brandLabel={i18n.t("navigation.brand")} links={links} />
  );
}
