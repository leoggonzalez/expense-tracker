"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

type NavigationProgressContextValue = {
  isNavigating: boolean;
  targetHref: string | null;
  push: (href: string) => void;
  replace: (href: string) => void;
  refresh: () => void;
};

const NavigationProgressContext =
  createContext<NavigationProgressContextValue | null>(null);

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    finished: Promise<void>;
  };
};

type NavigationProgressProviderProps = {
  children: React.ReactNode;
};

function runWithViewTransition(action: () => void): void {
  if (typeof document === "undefined") {
    action();
    return;
  }

  const transitionDocument = document as ViewTransitionDocument;

  if (!transitionDocument.startViewTransition) {
    action();
    return;
  }

  transitionDocument.startViewTransition(action);
}

export function NavigationProgressProvider({
  children,
}: NavigationProgressProviderProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetHref, setTargetHref] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // eslint-disable-next-line warn-use-effect -- This effect synchronizes the transient navigation state with pathname changes and clears the fallback timer.
  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    setIsNavigating(false);
    setTargetHref(null);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isNavigating, pathname]);

  const startNavigation = (href: string | null, action: () => void): void => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setIsNavigating(true);
    setTargetHref(href);
    runWithViewTransition(action);

    timeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      setTargetHref(null);
      timeoutRef.current = null;
    }, 1200);
  };

  const value: NavigationProgressContextValue = {
    isNavigating,
    targetHref,
    push: (href) => startNavigation(href, () => router.push(href)),
    replace: (href) => startNavigation(href, () => router.replace(href)),
    refresh: () => startNavigation(pathname, () => router.refresh()),
  };

  return (
    <NavigationProgressContext.Provider value={value}>
      {children}
    </NavigationProgressContext.Provider>
  );
}

export function useNavigationProgress(): NavigationProgressContextValue {
  const context = useContext(NavigationProgressContext);

  if (!context) {
    throw new Error(
      "useNavigationProgress must be used within NavigationProgressProvider",
    );
  }

  return context;
}
