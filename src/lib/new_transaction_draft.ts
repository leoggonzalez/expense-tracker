import { PersistedValue } from "@/lib/persisted_value";

export type NewTransactionDraft = {
  participantIds?: string[];
  category?: string;
  categoryWasManuallySelected?: boolean;
  spaceName: string;
  description: string;
  amountInput: string;
  beginDate: string;
  beginDateMode: "month" | "date";
  scheduleMode: "one_time" | "installments" | "unlimited";
  installments: string;
};

const draftValue = new PersistedValue<NewTransactionDraft>(
  "expense_tracker_new_transaction_draft",
);
const flowActiveValue = new PersistedValue<boolean>(
  "expense_tracker_new_transaction_flow_active",
);
const lastPathnameValue = new PersistedValue<string>(
  "expense_tracker_last_pathname",
);

function getDraftValue(spaceId?: string): PersistedValue<NewTransactionDraft> {
  return spaceId
    ? new PersistedValue<NewTransactionDraft>(
        `expense_tracker_new_transaction_draft_${spaceId}`,
      )
    : draftValue;
}

export function loadNewTransactionDraft(
  spaceId?: string,
): NewTransactionDraft | null {
  return getDraftValue(spaceId).load();
}

export function saveNewTransactionDraft(
  draft: NewTransactionDraft,
  spaceId?: string,
): void {
  getDraftValue(spaceId).save(draft);
}

export function clearNewTransactionDraft(spaceId?: string): void {
  getDraftValue(spaceId).clear();
}

export function isNewTransactionFlowActive(): boolean {
  return flowActiveValue.load() === true;
}

export function setNewTransactionFlowActive(isActive: boolean): void {
  flowActiveValue.save(isActive);
}

export function getLastPathname(): string | null {
  return lastPathnameValue.load();
}

export function setLastPathname(pathname: string): void {
  lastPathnameValue.save(pathname);
}
