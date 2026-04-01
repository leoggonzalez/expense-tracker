"use client";

const NEW_TRANSACTION_RECENT_REFRESH_EVENT =
  "new-transaction-recent-refresh";

export function triggerNewTransactionRecentRefresh(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(NEW_TRANSACTION_RECENT_REFRESH_EVENT));
}

export function subscribeToNewTransactionRecentRefresh(
  callback: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleRefresh = (): void => {
    callback();
  };

  window.addEventListener(
    NEW_TRANSACTION_RECENT_REFRESH_EVENT,
    handleRefresh,
  );

  return () => {
    window.removeEventListener(
      NEW_TRANSACTION_RECENT_REFRESH_EVENT,
      handleRefresh,
    );
  };
}
