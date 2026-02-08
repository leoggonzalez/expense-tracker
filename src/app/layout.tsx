import type { Metadata } from "next";
import { Navigation } from "@/components";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your income and expenses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
