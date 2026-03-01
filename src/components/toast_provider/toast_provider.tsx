"use client";

import "./toast_provider.scss";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Icon } from "@/elements";
import { i18n } from "@/model/i18n";
import type { IconName } from "@/elements/icon/icon_assets";

type ToastKind = "success" | "error";

type ToastState = {
  kind: ToastKind;
  message: React.ReactNode;
  iconName?: IconName;
  visible: boolean;
} | null;

type ToastOptions = {
  iconName?: IconName;
};

type ToastContextValue = {
  showSuccess: (message: React.ReactNode, options?: ToastOptions) => void;
  showError: (message: React.ReactNode, options?: ToastOptions) => void;
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

  const dismissToast = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    setToast((currentToast) =>
      currentToast ? { ...currentToast, visible: false } : currentToast,
    );

    clearTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, HIDE_DELAY_MS);
  };

  const showToast = (
    kind: ToastKind,
    message: React.ReactNode,
    options?: ToastOptions,
  ) => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
    }
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }

    setToast({ kind, message, iconName: options?.iconName, visible: true });

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
    showSuccess: (message, options) => showToast("success", message, options),
    showError: (message, options) => showToast("error", message, options),
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
            <span className="toast-provider__activity-icon" aria-hidden="true">
              <Icon
                name={
                  toast.iconName ||
                  (toast.kind === "success" ? "check" : "alert")
                }
                size={18}
              />
            </span>
            <span className="toast-provider__divider" aria-hidden="true" />
            <span className="toast-provider__message">{toast.message}</span>
            <button
              type="button"
              className="toast-provider__dismiss"
              onClick={dismissToast}
              aria-label={i18n.t("toast.dismiss") as string}
            >
              <Icon name="close" size={16} />
            </button>
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
