"use server";

import { addMonths, format } from "date-fns";

import { revalidateTransactionMutationPages } from "@/lib/app_revalidation";
import { normalizeTransactionAmount } from "@/lib/amount";
import { Space, type SpaceRecord } from "@/lib/space";
import {
  Transaction,
  type CreateTransactionInput,
  type CreateTransferInput,
  type DashboardTotals,
  type FilteredTransactionRecord,
  type ProjectionFocusedSpaceSummaryRow,
  type ProjectionFocusedSpaceTransactionRow,
  type TransactionFiltersInput,
  type TransactionWithSpaceRecord,
} from "@/lib/transaction";
import { requireCurrentUserAccount } from "@/lib/session";

export type { CreateTransactionInput, CreateTransferInput, DashboardTotals };

export type SerializedProjectionTransaction = {
  id: string;
  type: string;
  space: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardPayload = {
  totals: DashboardTotals;
  recentTransactions: Array<{
    id: string;
    type: string;
    spaceName: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
    transferSpaceId: string | null;
    transferSpaceName: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  upcomingPayments: Array<{
    id: string;
    type: string;
    spaceName: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
    transferSpaceId: string | null;
    transferSpaceName: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  currentMonthRange: {
    startDate: string;
    endDate: string;
  };
};

export type ProjectionMonthTransaction = {
  id: string;
  type: string;
  spaceName: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  transferSpaceId: string | null;
  transferSpaceName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectionChartMonth = {
  monthKey: string;
  monthLabel: string;
  income: number;
  expense: number;
  net: number;
};

export type ProjectionFocusedSpace = {
  spaceId: string;
  spaceName: string;
  monthTotal: number;
  monthTransactionCount: number;
  transactions: ProjectionMonthTransaction[];
};

export type ProjectionPagePayload = {
  focusedMonth: {
    key: string;
    label: string;
  };
  previousMonthKey: string;
  nextMonthKey: string;
  chartMonths: ProjectionChartMonth[];
  focusedMonthTotals: DashboardTotals;
  focusedMonthSpaces: ProjectionFocusedSpace[];
};

type TransactionListWithPagination = {
  transactions: FilteredTransactionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type FilteredTransactionListItem = {
  id: string;
  type: "income" | "expense";
  transferSpaceId: string | null;
  transferSpaceName: string | null;
  spaceName: string;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type TransactionMutationResult =
  | {
      success: true;
      transaction: TransactionWithSpaceRecord;
    }
  | {
      success: false;
      error: string;
    };

type MultipleTransactionMutationResult =
  | {
      success: true;
      transactions: TransactionWithSpaceRecord[];
    }
  | {
      success: false;
      error: string;
    };

type TransferMutationResult =
  | {
      success: true;
      transactions: TransactionWithSpaceRecord[];
    }
  | {
      success: false;
      error: string;
    };

type ProjectionFocusedSpaceAccumulator = {
  spaceId: string;
  spaceName: string;
  monthTotal: number;
  monthTransactionCount: number;
  transactions: ProjectionMonthTransaction[];
};

function serializeProjectionMonthTransactionRow(
  transaction: ProjectionFocusedSpaceTransactionRow,
): ProjectionMonthTransaction {
  return {
    id: transaction.id,
    type: transaction.type,
    spaceName: transaction.spaceName,
    description: transaction.description,
    amount: normalizeTransactionAmount(transaction.type, transaction.amount),
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
    transferSpaceId: transaction.transferSpaceId,
    transferSpaceName: transaction.transferSpaceName,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

function serializeProjectionTransaction(
  transaction: TransactionWithSpaceRecord,
): SerializedProjectionTransaction {
  return {
    id: transaction.id,
    type: transaction.type,
    space: transaction.space.name,
    description: transaction.description,
    amount: transaction.amount,
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

function serializeDashboardTransaction(transaction: TransactionWithSpaceRecord) {
  return {
    id: transaction.id,
    type: transaction.type,
    spaceName: transaction.space.name,
    description: transaction.description,
    amount: normalizeTransactionAmount(transaction.type, transaction.amount),
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
    transferSpaceId: transaction.transferSpaceId,
    transferSpaceName: transaction.transferSpace?.name || null,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

function serializeFilteredTransaction(
  transaction: FilteredTransactionRecord,
): FilteredTransactionListItem {
  return {
    id: transaction.id,
    type: transaction.type as "income" | "expense",
    transferSpaceId: transaction.transferSpaceId,
    transferSpaceName: transaction.transferSpace?.name || null,
    spaceName: transaction.space.name,
    description: transaction.description,
    amount: normalizeTransactionAmount(transaction.type, transaction.amount),
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

function mapProjectionSpaces(
  spaceSummaryRows: ProjectionFocusedSpaceSummaryRow[],
  spaceTransactionsRows: ProjectionFocusedSpaceTransactionRow[],
): ProjectionFocusedSpace[] {
  const spaceMap = new Map<string, ProjectionFocusedSpaceAccumulator>(
    spaceSummaryRows.map((space) => [
      space.spaceId,
      {
        spaceId: space.spaceId,
        spaceName: space.spaceName,
        monthTotal: Number(space.monthTotal || 0),
        monthTransactionCount: Number(space.monthTransactionCount || 0),
        transactions: [],
      },
    ]),
  );

  spaceTransactionsRows.forEach((transaction) => {
    const existing = spaceMap.get(transaction.spaceId);

    if (!existing) {
      return;
    }

    existing.transactions.push(serializeProjectionMonthTransactionRow(transaction));
  });

  return Array.from(spaceMap.values())
    .sort((left, right) => left.spaceName.localeCompare(right.spaceName))
    .map((space) => ({
      spaceId: space.spaceId,
      spaceName: space.spaceName,
      monthTotal: space.monthTotal,
      monthTransactionCount: space.monthTransactionCount,
      transactions: space.transactions,
    }));
}

export async function syncAllCurrentMonthTransactionCounters(): Promise<void> {
  await Transaction.syncAllCurrentMonthSpaceCounters();
}

// Create
export async function createTransaction(
  input: CreateTransactionInput,
): Promise<TransactionMutationResult> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const transaction = await Transaction.createForUser(currentUser.id, input);
    revalidateTransactionMutationPages();

    return { success: true, transaction };
  } catch (error) {
    if (error instanceof Error && error.message === "space_is_archived") {
      return { success: false, error: "space_is_archived" };
    }

    console.error("Error creating transaction:", error);
    return { success: false, error: "failed_to_create_transaction" };
  }
}

export async function createTransferTransaction(
  input: CreateTransferInput,
): Promise<TransferMutationResult> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const transactions = await Transaction.createTransferForUser(
      currentUser.id,
      input,
    );
    revalidateTransactionMutationPages();

    return { success: true, transactions };
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "transfer_same_space",
        "invalid_transfer_amount",
        "invalid_transfer_spaces",
      ].includes(error.message)
    ) {
      return { success: false, error: error.message };
    }

    console.error("Error creating transfer transaction:", error);
    return { success: false, error: "failed_to_create_transfer" };
  }
}

export async function createMultipleTransactions(
  inputs: CreateTransactionInput[],
): Promise<MultipleTransactionMutationResult> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const transactions = await Transaction.createManyForUser(
      currentUser.id,
      inputs,
    );
    revalidateTransactionMutationPages();

    return { success: true, transactions };
  } catch (error) {
    if (error instanceof Error && error.message === "space_is_archived") {
      return { success: false, error: "space_is_archived" };
    }

    console.error("Error creating multiple transactions:", error);
    return { success: false, error: "failed_to_create_transactions" };
  }
}

// Read
export async function getMonthTotals(
  monthStart: Date,
): Promise<DashboardTotals> {
  const currentUser = await requireCurrentUserAccount();

  try {
    return await Transaction.getMonthTotalsForUser(currentUser.id, monthStart);
  } catch (error) {
    console.error("Error fetching month totals:", error);
    return { income: 0, expense: 0, net: 0 };
  }
}

export async function getCurrentMonthTotals(): Promise<DashboardTotals> {
  return getMonthTotals(new Date());
}

export async function getTransactions(): Promise<TransactionWithSpaceRecord[]> {
  const currentUser = await requireCurrentUserAccount();

  try {
    return await Transaction.listByUser(currentUser.id);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function getRecentTransactions(
  limit: number = 10,
): Promise<TransactionWithSpaceRecord[]> {
  const currentUser = await requireCurrentUserAccount();

  try {
    return await Transaction.listRecentByUser(currentUser.id, limit);
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return [];
  }
}

export async function getProjectionTransactions(): Promise<
  SerializedProjectionTransaction[]
> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const transactions = await Transaction.listByUser(currentUser.id);
    return transactions.map(serializeProjectionTransaction);
  } catch (error) {
    console.error("Error fetching projection transactions:", error);
    return [];
  }
}

export async function getProjectionPagePayload(
  focusedMonthStart: Date,
): Promise<ProjectionPagePayload> {
  const currentUser = await requireCurrentUserAccount();

  const projectionData = await Transaction.getProjectionQueryData(
    currentUser.id,
    focusedMonthStart,
  );

  const chartMonths: ProjectionChartMonth[] = projectionData.chartRows.map(
    (row, index) => {
      const monthStart = addMonths(projectionData.normalizedFocusedMonthStart, index);
      const income = Number(row.income || 0);
      const expense = Number(row.expense || 0);

      return {
        monthKey: row.monthKey,
        monthLabel: format(monthStart, "MMMM yyyy"),
        income,
        expense,
        net: income + expense,
      };
    },
  );

  return {
    focusedMonth: {
      key: format(projectionData.normalizedFocusedMonthStart, "yyyy-MM"),
      label: format(projectionData.normalizedFocusedMonthStart, "MMMM yyyy"),
    },
    previousMonthKey: format(
      addMonths(projectionData.normalizedFocusedMonthStart, -1),
      "yyyy-MM",
    ),
    nextMonthKey: format(
      addMonths(projectionData.normalizedFocusedMonthStart, 1),
      "yyyy-MM",
    ),
    chartMonths,
    focusedMonthTotals: projectionData.focusedMonthTotals,
    focusedMonthSpaces: mapProjectionSpaces(
      projectionData.spaceSummaryRows,
      projectionData.spaceTransactionsRows,
    ),
  };
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const currentUser = await requireCurrentUserAccount();
  const dashboardData = await Transaction.getDashboardQueryData(currentUser.id);

  return {
    totals: dashboardData.totals,
    recentTransactions: dashboardData.recentTransactions.map(
      serializeDashboardTransaction,
    ),
    upcomingPayments: dashboardData.upcomingPayments.map(
      serializeDashboardTransaction,
    ),
    currentMonthRange: {
      startDate: format(dashboardData.monthStart, "yyyy-MM-dd"),
      endDate: format(dashboardData.monthEnd, "yyyy-MM-dd"),
    },
  };
}

export async function getTransactionsWithFilters(
  filters: TransactionFiltersInput,
): Promise<TransactionListWithPagination> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const result = await Transaction.getFilteredTransactionsForUser(
      currentUser.id,
      filters,
    );

    return {
      transactions: result.transactions.map(serializeFilteredTransaction),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  } catch (error) {
    console.error("Error fetching filtered transactions:", error);
    return {
      transactions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }
}

export async function getSpaces(): Promise<SpaceRecord[]> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const spaces = await Space.listActiveByUser(currentUser.id);
    return spaces.map((space) => space.toRecord());
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }
}

export async function getTransactionById(
  id: string,
): Promise<TransactionWithSpaceRecord | null> {
  const currentUser = await requireCurrentUserAccount();

  try {
    return await Transaction.findWithSpaceByIdForUser(currentUser.id, id);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
}

// Update
export async function updateTransaction(
  id: string,
  input: Partial<CreateTransactionInput>,
): Promise<TransactionMutationResult> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const transaction = await Transaction.updateForUser(
      currentUser.id,
      id,
      input,
    );
    revalidateTransactionMutationPages();

    return { success: true, transaction };
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "failed_to_update_transaction",
        "space_is_archived",
      ].includes(error.message)
    ) {
      return { success: false, error: error.message };
    }

    console.error("Error updating transaction:", error);
    return { success: false, error: "failed_to_update_transaction" };
  }
}

// Delete/Archive
export async function deleteTransaction(id: string) {
  const currentUser = await requireCurrentUserAccount();

  try {
    await Transaction.deleteForUser(currentUser.id, id);
    revalidateTransactionMutationPages();

    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "failed_to_delete_transaction"
    ) {
      return { success: false, error: error.message };
    }

    console.error("Error deleting transaction:", error);
    return { success: false, error: "failed_to_delete_transaction" };
  }
}
