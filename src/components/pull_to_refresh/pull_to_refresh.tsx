"use client";

import "./pull_to_refresh.scss";

import React, { useEffect, useRef, useState } from "react";
import { useNavigationProgress } from "@/components/navigation_progress_provider/navigation_progress_provider";
import { Icon } from "@/elements/icon/icon";
import { i18n } from "@/model/i18n";

const PHONE_MEDIA_QUERY = "(max-width: 767px)";
const STANDALONE_MEDIA_QUERY = "(display-mode: standalone)";
const PULL_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 112;
const REFRESH_HOLD_OFFSET = 52;

type PullToRefreshProps = {
  disabled?: boolean;
  targetRef: React.RefObject<HTMLElement | null>;
};

type LegacyMediaQueryList = MediaQueryList & {
  addListener: (listener: () => void) => void;
  removeListener: (listener: () => void) => void;
};

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const standaloneMediaQuery = window.matchMedia(STANDALONE_MEDIA_QUERY);
  const standaloneNavigator = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    standaloneMediaQuery.matches || standaloneNavigator.standalone === true
  );
}

function isScrollAtTop(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const scrollingElement = document.scrollingElement;
  const scrollTop = scrollingElement?.scrollTop ?? window.scrollY ?? 0;

  return scrollTop <= 0;
}

function getPullDistance(deltaY: number): number {
  if (deltaY <= 0) {
    return 0;
  }

  if (deltaY <= MAX_PULL_DISTANCE) {
    return deltaY;
  }

  return MAX_PULL_DISTANCE + (deltaY - MAX_PULL_DISTANCE) * 0.35;
}

function subscribeToMediaQuery(
  mediaQueryList: MediaQueryList,
  listener: () => void,
): () => void {
  if ("addEventListener" in mediaQueryList) {
    mediaQueryList.addEventListener("change", listener);

    return () => {
      mediaQueryList.removeEventListener("change", listener);
    };
  }

  const legacyMediaQueryList = mediaQueryList as LegacyMediaQueryList;

  legacyMediaQueryList.addListener(listener);

  return () => {
    legacyMediaQueryList.removeListener(listener);
  };
}

export function PullToRefresh({
  disabled = false,
  targetRef,
}: PullToRefreshProps): React.ReactElement {
  const { isNavigating, refresh } = useNavigationProgress();
  const [isEnabled, setIsEnabled] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const refreshTriggeredRef = useRef(false);

  const isVisible = pullDistance > 0 || isRefreshing;
  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const isReady = pullDistance >= PULL_THRESHOLD;
  const indicatorLabel = isRefreshing
    ? String(i18n.t("app_shell.refreshing"))
    : String(i18n.t("app_shell.pull_to_refresh"));
  const indicatorOffset = isRefreshing ? REFRESH_HOLD_OFFSET : pullDistance;

  function resetPullState(): void {
    startYRef.current = null;
    pullDistanceRef.current = 0;
    setPullDistance(0);
  }

  // eslint-disable-next-line warn-use-effect -- This effect keeps client-only device and standalone-mode gating in sync with viewport and PWA display-mode changes.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const phoneMediaQuery = window.matchMedia(PHONE_MEDIA_QUERY);
    const standaloneMediaQuery = window.matchMedia(STANDALONE_MEDIA_QUERY);

    function updateEnabledState(): void {
      const hasTouchSupport = navigator.maxTouchPoints > 0;

      setIsEnabled(
        hasTouchSupport &&
          phoneMediaQuery.matches &&
          isStandaloneMode() &&
          !disabled,
      );
    }

    updateEnabledState();
    const unsubscribePhone = subscribeToMediaQuery(
      phoneMediaQuery,
      updateEnabledState,
    );
    const unsubscribeStandalone = subscribeToMediaQuery(
      standaloneMediaQuery,
      updateEnabledState,
    );

    return () => {
      unsubscribePhone();
      unsubscribeStandalone();
    };
  }, [disabled]);

  // eslint-disable-next-line warn-use-effect -- This effect mirrors refresh lifecycle state from the shared navigation-progress provider so the pull indicator resolves cleanly after router.refresh().
  useEffect(() => {
    if (isNavigating) {
      return;
    }

    if (refreshTriggeredRef.current) {
      refreshTriggeredRef.current = false;
      setIsRefreshing(false);
    }
  }, [isNavigating]);

  // eslint-disable-next-line warn-use-effect -- This effect synchronizes the shell classes and CSS custom properties that drive the pull indicator and content offset.
  useEffect(() => {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    target.style.setProperty(
      "--pull-to-refresh-offset",
      `${indicatorOffset.toFixed(2)}px`,
    );
    target.style.setProperty("--pull-to-refresh-progress", progress.toFixed(3));
    target.classList.toggle("app-main--pull-to-refresh-visible", isVisible);
    target.classList.toggle(
      "app-main--pull-to-refresh-active",
      pullDistance > 0 && !isRefreshing,
    );
    target.classList.toggle("app-main--pull-to-refresh-ready", isReady);
    target.classList.toggle(
      "app-main--pull-to-refresh-refreshing",
      isRefreshing,
    );

    return () => {
      target.style.removeProperty("--pull-to-refresh-offset");
      target.style.removeProperty("--pull-to-refresh-progress");
      target.classList.remove("app-main--pull-to-refresh-visible");
      target.classList.remove("app-main--pull-to-refresh-active");
      target.classList.remove("app-main--pull-to-refresh-ready");
      target.classList.remove("app-main--pull-to-refresh-refreshing");
    };
  }, [
    indicatorOffset,
    isReady,
    isRefreshing,
    isVisible,
    progress,
    pullDistance,
    targetRef,
  ]);

  // eslint-disable-next-line warn-use-effect -- This effect owns the touch gesture listeners and keeps them stable while the pull-to-refresh feature is enabled.
  useEffect(() => {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    if (!isEnabled || isNavigating || isRefreshing) {
      if (pullDistanceRef.current > 0) {
        resetPullState();
      }

      return;
    }

    function handleTouchStart(event: TouchEvent): void {
      if (event.touches.length !== 1 || !isScrollAtTop()) {
        resetPullState();
        return;
      }

      startYRef.current = event.touches[0]?.clientY ?? null;
    }

    function handleTouchMove(event: TouchEvent): void {
      if (startYRef.current === null || event.touches.length !== 1) {
        return;
      }

      if (!isScrollAtTop() && pullDistanceRef.current === 0) {
        resetPullState();
        return;
      }

      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const nextPullDistance = getPullDistance(currentY - startYRef.current);

      if (nextPullDistance <= 0) {
        if (pullDistanceRef.current > 0) {
          resetPullState();
        }

        return;
      }

      event.preventDefault();
      pullDistanceRef.current = nextPullDistance;
      setPullDistance(nextPullDistance);
    }

    function handleTouchEnd(): void {
      if (startYRef.current === null) {
        return;
      }

      const shouldRefresh = pullDistanceRef.current >= PULL_THRESHOLD;

      resetPullState();

      if (!shouldRefresh) {
        return;
      }

      refreshTriggeredRef.current = true;
      setIsRefreshing(true);
      refresh();
    }

    function handleTouchCancel(): void {
      resetPullState();
    }

    target.addEventListener("touchstart", handleTouchStart, { passive: true });
    target.addEventListener("touchmove", handleTouchMove, { passive: false });
    target.addEventListener("touchend", handleTouchEnd, { passive: true });
    target.addEventListener("touchcancel", handleTouchCancel, {
      passive: true,
    });

    return () => {
      target.removeEventListener("touchstart", handleTouchStart);
      target.removeEventListener("touchmove", handleTouchMove);
      target.removeEventListener("touchend", handleTouchEnd);
      target.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [isEnabled, isNavigating, isRefreshing, refresh, targetRef]);

  if (!isEnabled && !isVisible) {
    return <></>;
  }

  return (
    <div
      className={[
        "pull-to-refresh",
        isVisible && "pull-to-refresh--visible",
        isReady && "pull-to-refresh--ready",
        isRefreshing && "pull-to-refresh--refreshing",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden={!isVisible}
    >
      <div
        className="pull-to-refresh__indicator"
        role="status"
        aria-live="polite"
      >
        <span className="pull-to-refresh__icon">
          <Icon name={isRefreshing ? "activity" : "chevron-down"} size={16} />
        </span>
        <span className="pull-to-refresh__label">{indicatorLabel}</span>
      </div>
    </div>
  );
}
