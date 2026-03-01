"use client";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

import { setLastPathname, setNewEntryFlowActive } from "@/lib/new_entry_draft";

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
  const isAuthRoute = pathname === "/login" || pathname === "/login/verify";
  const isNewEntryRoute = pathname.startsWith("/entries/new");
  const isFabHiddenRoute = isAuthRoute || isNewEntryRoute;

  useEffect(() => {
    if (!isNewEntryRoute) {
      setNewEntryFlowActive(false);
      setLastPathname(pathname);
    }
  }, [isNewEntryRoute, pathname]);

  return (
    <div
      className={`app-container ${isAuthRoute ? "app-container--auth" : ""}`}
    >
      {!isAuthRoute && navigation}
      <main className={`app-main ${isAuthRoute ? "app-main--auth" : ""}`}>
        {children}
      </main>
      {!isFabHiddenRoute && floatingEntryButton}
    </div>
  );
}
