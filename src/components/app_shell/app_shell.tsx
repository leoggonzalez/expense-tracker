"use client";

import "./app_shell.scss";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { useNavigationProgress } from "@/components/navigation_progress_provider/navigation_progress_provider";

import {
  clearNewEntryDraft,
  setLastPathname,
  setNewEntryFlowActive,
} from "@/lib/new_entry_draft";

type AppShellProps = {
  navigation: React.ReactNode;
  navbar: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({
  navigation,
  navbar,
  children,
}: AppShellProps): React.ReactElement {
  const pathname = usePathname();
  const { isNavigating } = useNavigationProgress();
  const isAuthRoute = pathname === "/login" || pathname === "/login/verify";
  const isSingleEntryDraftRoute =
    pathname === "/entries/new/income" || pathname === "/entries/new/expense";

  // eslint-disable-next-line warn-use-effect -- This effect keeps draft persistence and last-path tracking synchronized with route changes.
  useEffect(() => {
    if (!isSingleEntryDraftRoute) {
      clearNewEntryDraft();
      setNewEntryFlowActive(false);
    }

    setLastPathname(pathname);
  }, [isSingleEntryDraftRoute, pathname]);

  return (
    <div
      className={[
        "app-container",
        isAuthRoute && "app-container--auth",
        !isAuthRoute && "app-container--protected",
        isNavigating && "app-container--navigating",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="app-shell__loading-bar" aria-hidden="true" />
      {!isAuthRoute && navigation}
      {!isAuthRoute && navbar}
      <main
        className={`app-main ${isAuthRoute ? "app-main--auth" : ""}`}
        aria-busy={isNavigating}
      >
        {children}
      </main>
    </div>
  );
}
