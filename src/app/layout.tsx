import type { Metadata } from "next";
import { Navigation } from "@/components";
import { i18n } from "@/model/i18n";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: String(i18n.t("metadata.title")),
  description: String(i18n.t("metadata.description")),
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
