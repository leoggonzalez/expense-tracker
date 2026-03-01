"use client";

import "./toast_provider.scss";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ToastKind = "success" | "error";

type ToastState = {
  kind: ToastKind;
  message: string;
  visible: boolean;
} | null;

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

type ToastProviderProps = {
  children: React.ReactNode;
};

const HIDE_DELAY_MS = 250;
const SUCCESS_DURATION_MS = 2500;
const ERROR_DURATION_MS = 4000;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({
  children,
}: ToastProviderProps): React.ReactElement {
  const [toast, setToast] = useState<ToastState>(null);
  const hideTimerRef = useRef<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const showToast = (kind: ToastKind, message: string) => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
    }
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }

    setToast({ kind, message, visible: true });

    const duration =
      kind === "success" ? SUCCESS_DURATION_MS : ERROR_DURATION_MS;

    hideTimerRef.current = window.setTimeout(() => {
      setToast((currentToast) =>
        currentToast ? { ...currentToast, visible: false } : currentToast,
      );
    }, duration);

    clearTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, duration + HIDE_DELAY_MS);
  };

  const contextValue: ToastContextValue = {
    showSuccess: (message: string) => showToast("success", message),
    showError: (message: string) => showToast("error", message),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-provider" aria-live="polite" aria-atomic="true">
        {toast && (
          <div
            className={[
              "toast-provider__toast",
              `toast-provider__toast--${toast.kind}`,
              toast.visible && "toast-provider__toast--visible",
            ]
              .filter(Boolean)
              .join(" ")}
            role="status"
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
