"use client";

import { usePathname } from "next/navigation";
import React from "react";

type AppShellProps = {
  navigation: React.ReactNode;
  floatingEntryButton: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({
  navigation,
  floatingEntryButton,
  children,
}: AppShellProps): React.ReactElement {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" || pathname === "/login/verify";

  return (
    <div className={`app-container ${isAuthRoute ? "app-container--auth" : ""}`}>
      {!isAuthRoute && navigation}
      <main className={`app-main ${isAuthRoute ? "app-main--auth" : ""}`}>
        {children}
      </main>
      {!isAuthRoute && floatingEntryButton}
    </div>
  );
}
