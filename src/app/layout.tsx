import type { Metadata } from "next";
import { Navigation } from "@/components/navigation/navigation";
import { AppShell } from "@/components/app_shell/app_shell";
import { FloatingEntryButton } from "@/components/floating_entry_button/floating_entry_button";
import { i18n } from "@/model/i18n";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: i18n.t("metadata.title") as string,
  description: i18n.t("metadata.description") as string,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <AppShell
          navigation={<Navigation />}
          floatingEntryButton={<FloatingEntryButton />}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
