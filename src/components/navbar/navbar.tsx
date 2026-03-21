import "./navbar.scss";

import { AppLink } from "@/components/app_link/app_link";
import { Avatar } from "@/components/avatar/avatar";
import { Container } from "@/components/container/container";
import { Icon, Stack } from "@/elements";
import { getCurrentUserAccount } from "@/lib/session";
import { i18n } from "@/model/i18n";

export async function Navbar(): Promise<React.ReactElement | null> {
  const currentUser = await getCurrentUserAccount();

  if (!currentUser) {
    return null;
  }

  const displayName =
    currentUser.name || String(i18n.t("navigation.user_fallback_name"));

  return (
    <header className="navbar">
      <Container maxWidth="wide">
        <div className="navbar__content">
          <Stack
            direction="row"
            align="center"
            justify="flex-end"
            gap={16}
            fullWidth
          >
          <AppLink href="/account" ariaLabel={displayName}>
            <span className="navbar__avatar-link">
              <Avatar name={displayName} />
            </span>
          </AppLink>

          <AppLink
            href="/settings"
            ariaLabel={String(i18n.t("navigation.settings"))}
          >
            <span className="navbar__settings-link">
              <Icon name="settings" size={20} />
            </span>
          </AppLink>
          </Stack>
        </div>
      </Container>
    </header>
  );
}
