import { PersistedValue } from "@/lib/persisted_value";

export type NewEntryDraft = {
  spaceName: string;
  description: string;
  amountInput: string;
  beginDate: string;
  beginDateMode: "month" | "date";
  scheduleMode: "one_time" | "installments" | "unlimited";
  installments: string;
};

const draftValue = new PersistedValue<NewEntryDraft>(
  "expense_tracker_new_entry_draft",
);
const flowActiveValue = new PersistedValue<boolean>(
  "expense_tracker_new_entry_flow_active",
);
const lastPathnameValue = new PersistedValue<string>(
  "expense_tracker_last_pathname",
);

export function loadNewEntryDraft(): NewEntryDraft | null {
  return draftValue.load();
}

export function saveNewEntryDraft(draft: NewEntryDraft): void {
  draftValue.save(draft);
}

export function clearNewEntryDraft(): void {
  draftValue.clear();
}

export function isNewEntryFlowActive(): boolean {
  return flowActiveValue.load() === true;
}

export function setNewEntryFlowActive(isActive: boolean): void {
  flowActiveValue.save(isActive);
}

export function getLastPathname(): string | null {
  return lastPathnameValue.load();
}

export function setLastPathname(pathname: string): void {
  lastPathnameValue.save(pathname);
}
