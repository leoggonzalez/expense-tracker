import type { Metadata } from "next";
import { Navigation } from "@/components";
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
        <div className="app-container">
          <Navigation />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
