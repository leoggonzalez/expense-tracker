import type { Metadata } from "next";
import { Navigation } from "@/components/navigation/navigation";
import { AppShell } from "@/components/app_shell/app_shell";
import { AppPreferencesProvider } from "@/components/app_preferences_provider/app_preferences_provider";
import { NavigationProgressProvider } from "@/components/navigation_progress_provider/navigation_progress_provider";
import { FloatingEntryButton } from "@/components/floating_entry_button/floating_entry_button";
import { ToastProvider } from "@/components/toast_provider/toast_provider";
import { i18n } from "@/model/i18n";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: i18n.t("metadata.title") as string,
  description: i18n.t("metadata.description") as string,
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
      { url: "/icon", sizes: "192x192", type: "image/png" },
    ],
    shortcut: [{ url: "/icon", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <AppPreferencesProvider>
          <NavigationProgressProvider>
            <ToastProvider>
              <AppShell
                navigation={<Navigation />}
                floatingEntryButton={<FloatingEntryButton />}
              >
                {children}
              </AppShell>
            </ToastProvider>
          </NavigationProgressProvider>
        </AppPreferencesProvider>
      </body>
    </html>
  );
}
