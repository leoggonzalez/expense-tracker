"use client";

import "@/components/app_shell/app_shell.scss";

import { useNavigationProgress } from "@/components/navigation_progress_provider/navigation_progress_provider";
import { PullToRefresh } from "@/components/pull_to_refresh/pull_to_refresh";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef } from "react";

import {
  clearNewTransactionDraft,
  getLastPathname,
  setLastPathname,
  setNewTransactionFlowActive,
} from "@/lib/new_transaction_draft";

import {
  getSpaceIdFromPath,
  isTransactionDraftPath,
} from "@/lib/transaction_creation";

interface AppShellProps {
  navigation: React.ReactNode;
  navbar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  navigation,
  navbar,
  children,
}: AppShellProps): React.ReactElement {
  const pathname = usePathname();
  const { isNavigating } = useNavigationProgress();
  const mainRef = useRef<HTMLElement | null>(null);
  const isAuthRoute = pathname === "/login" || pathname === "/login/verify";
  const isSingleTransactionDraftRoute = isTransactionDraftPath(pathname);

  // eslint-disable-next-line warn-use-effect -- This effect keeps draft persistence and last-path tracking synchronized with route changes.
  useEffect(() => {
    const previousPath = getLastPathname();
    if (
      previousPath &&
      isTransactionDraftPath(previousPath) &&
      (!isSingleTransactionDraftRoute ||
        getSpaceIdFromPath(previousPath) !== getSpaceIdFromPath(pathname))
    ) {
      clearNewTransactionDraft(getSpaceIdFromPath(previousPath));
      setNewTransactionFlowActive(false);
    }

    setLastPathname(pathname);
  }, [isSingleTransactionDraftRoute, pathname]);

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
        ref={mainRef}
      >
        {!isAuthRoute ? <PullToRefresh targetRef={mainRef} /> : null}
        <div className="app-main__content">{children}</div>
      </main>
    </div>
  );
}
