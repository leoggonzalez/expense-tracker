"use client";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

import {
  clearNewEntryDraft,
  setLastPathname,
  setNewEntryFlowActive,
} from "@/lib/new_entry_draft";

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
  const isSingleEntryDraftRoute =
    pathname === "/entries/new/income" || pathname === "/entries/new/expense";
  const isNewEntryRoute = pathname.startsWith("/entries/new");
  const isFabHiddenRoute = isAuthRoute || isNewEntryRoute;

  useEffect(() => {
    if (!isSingleEntryDraftRoute) {
      clearNewEntryDraft();
      setNewEntryFlowActive(false);
    }

    setLastPathname(pathname);
  }, [isSingleEntryDraftRoute, pathname]);

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
