import { deriveScheduleFromDates } from "@/lib/transaction_schedule";
import { parseSplitParticipants } from "@/lib/transaction_split";

export interface MassEditTransaction {
  id: string;
  type: string;
  spaceId: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  splitParticipantIds: string;
  transferSpaceId: string | null;
  updatedAt: string;
}

export interface MassTransactionUpdate {
  type?: "income" | "expense";
  spaceId?: string;
  transactions: {
    id: string;
    description: string;
    amount: number;
    beginDate: string;
    updatedAt: string;
  }[];
}

interface SelectionTransaction {
  splitParticipantIds: string;
  beginDate: string;
  endDate: string | null;
  transferSpaceId?: string | null;
}

export function getMassEditBlockReason(
  transactions: SelectionTransaction[],
): string | null {
  if (transactions.length > 500) return "mass_edit.selection_limit";
  if (transactions.some((transaction) => transaction.transferSpaceId))
    return "mass_edit.transfers_unsupported";
  const groups = new Set(
    transactions.map((transaction) =>
      JSON.stringify(
        parseSplitParticipants(transaction.splitParticipantIds).sort(),
      ),
    ),
  );
  if (groups.size > 1) return "mass_edit.different_splits";
  const schedules = new Set(
    transactions.map((transaction) => {
      const schedule = deriveScheduleFromDates({
        beginDate: new Date(transaction.beginDate),
        endDate: transaction.endDate ? new Date(transaction.endDate) : null,
      });
      return JSON.stringify(schedule);
    }),
  );
  return schedules.size > 1 ? "mass_edit.different_schedules" : null;
}

export function serializeMassEditTransaction(
  transaction: {
    id: string;
    type: string;
    spaceId: string;
    description: string;
    amount: number;
    beginDate: Date;
    endDate: Date | null;
    splitParticipantIds: string | null;
    transferSpaceId: string | null;
    updatedAt: Date;
  },
  ownerId: string,
): MassEditTransaction {
  return {
    ...transaction,
    splitParticipantIds: transaction.splitParticipantIds || ownerId,
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
    updatedAt: transaction.updatedAt.toISOString(),
  };
}
