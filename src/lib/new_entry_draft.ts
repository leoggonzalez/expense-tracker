export type NewEntryDraft = {
  accountName: string;
  description: string;
  amountInput: string;
  beginDate: string;
  endDate: string;
  isRecurring: boolean;
};

const NEW_ENTRY_DRAFT_KEY = "expense_tracker_new_entry_draft";
const NEW_ENTRY_FLOW_ACTIVE_KEY = "expense_tracker_new_entry_flow_active";
const LAST_PATHNAME_KEY = "expense_tracker_last_pathname";

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined";
}

export function loadNewEntryDraft(): NewEntryDraft | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const draft = window.sessionStorage.getItem(NEW_ENTRY_DRAFT_KEY);

  if (!draft) {
    return null;
  }

  try {
    return JSON.parse(draft) as NewEntryDraft;
  } catch {
    return null;
  }
}

export function saveNewEntryDraft(draft: NewEntryDraft): void {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(NEW_ENTRY_DRAFT_KEY, JSON.stringify(draft));
}

export function clearNewEntryDraft(): void {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(NEW_ENTRY_DRAFT_KEY);
}

export function isNewEntryFlowActive(): boolean {
  if (!canUseSessionStorage()) {
    return false;
  }

  return window.sessionStorage.getItem(NEW_ENTRY_FLOW_ACTIVE_KEY) === "true";
}

export function setNewEntryFlowActive(isActive: boolean): void {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(
    NEW_ENTRY_FLOW_ACTIVE_KEY,
    isActive ? "true" : "false",
  );
}

export function getLastPathname(): string | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  return window.sessionStorage.getItem(LAST_PATHNAME_KEY);
}

export function setLastPathname(pathname: string): void {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(LAST_PATHNAME_KEY, pathname);
}
