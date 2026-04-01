"use server";

import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";

import { revalidateTransactionMutationPages } from "@/lib/app_revalidation";
import { normalizeTransactionAmount } from "@/lib/amount";
import { formatProjectionMonthKey } from "@/lib/projection_month";
import { Space, type SpaceRecord } from "@/lib/space";
import {
  Transaction,
  type CreateTransactionInput,
  type CreateTransferInput,
  type DashboardCreditCardSettlementRecord,
  type DashboardUpcomingTransactionRecord,
  type DashboardUpcomingPaymentRecord,
  type DashboardTotals,
  type FilteredTransactionRecord,
  type ProjectionFocusedSpaceSummaryRow,
  type ProjectionFocusedSpaceTransactionRow,
  type TransactionFiltersInput,
  type TransactionWithSpaceRecord,
} from "@/lib/transaction";
import { requireCurrentUserAccount } from "@/lib/session";

export type { CreateTransactionInput, CreateTransferInput, DashboardTotals };

export type DashboardDateRange = {
  startDate: string;
  endDate: string;
};

export type DashboardTransactionItem = {
  id: string;
  kind: "transaction";
  type: string;
  spaceId: string;
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

export type DashboardCreditCardSettlementItem = {
  id: string;
  kind: "credit_card_settlement";
  spaceId: string;
  spaceName: string;
  description: string;
  amount: number;
  dueDate: string;
  projectedMonthRange: DashboardDateRange;
};

export type DashboardUpcomingTransactionItem = {
  id: string;
  kind: "transaction";
  type: "income" | "expense";
  spaceId: string;
  spaceName: string;
  description: string;
  amount: number;
  dueDate: string;
};

export type DashboardUpcomingItem =
  | DashboardCreditCardSettlementItem
  | DashboardUpcomingTransactionItem;

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
  recentTransactions: DashboardTransactionItem[];
  upcomingPayments: DashboardUpcomingItem[];
  currentMonthRange: DashboardDateRange;
};

export type DashboardHeaderPayload = {
  totals: DashboardTotals;
  currentMonthRange: DashboardDateRange;
};

export type DashboardUpcomingPayload = {
  upcomingRange: DashboardDateRange;
  upcomingPayments: DashboardUpcomingItem[];
};

export type DashboardRecentActivityPayload = {
  currentMonthRange: DashboardDateRange;
  recentTransactions: DashboardTransactionItem[];
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

export type ProjectionHeaderPayload = {
  focusedMonthKey: string;
  previousMonthKey: string;
  nextMonthKey: string;
  focusedMonthTotals: DashboardTotals;
};

export type ProjectionChartPayload = {
  focusedMonthKey: string;
  chartMonths: ProjectionChartMonth[];
};

export type ProjectionSpacesPayload = {
  focusedMonthKey: string;
  focusedMonthSpaces: ProjectionFocusedSpace[];
};

export type TransactionsPagePayload = {
  spaces: Array<{
    id: string;
    name: string;
  }>;
  transactions: FilteredTransactionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type TransactionDetailPayload = {
  id: string;
  type: string;
  mainSpaceId: string | null;
  spaceId: string;
  spaceName: string;
  transferSpaceId: string | null;
  transferSpaceName: string | null;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
};

export type NewTransactionRecentPayload = {
  recentTransactions: DashboardTransactionItem[];
};

export type NewTransactionSpacesPayload = {
  spaces: Array<{
    id: string;
    name: string;
    main: boolean | null;
  }>;
};

export type NewTransferSpacesPayload = {
  spaces: Array<{
    id: string;
    name: string;
    currentMonthTotal: number;
  }>;
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

function serializeDashboardTransaction(
  transaction: TransactionWithSpaceRecord,
): DashboardTransactionItem {
  return {
    id: transaction.id,
    kind: "transaction",
    type: transaction.type,
    spaceId: transaction.spaceId,
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

function serializeDashboardCreditCardSettlement(
  settlement: DashboardCreditCardSettlementRecord,
): DashboardCreditCardSettlementItem {
  return {
    id: settlement.id,
    kind: "credit_card_settlement",
    spaceId: settlement.spaceId,
    spaceName: settlement.spaceName,
    description: settlement.description,
    amount: settlement.amount,
    dueDate: settlement.dueDate.toISOString(),
    projectedMonthRange: serializeDashboardDateRange(
      settlement.projectedMonthStart,
      settlement.projectedMonthEnd,
    ),
  };
}

function serializeDashboardUpcomingTransaction(
  transaction: DashboardUpcomingTransactionRecord,
): DashboardUpcomingTransactionItem {
  return {
    id: transaction.id,
    kind: "transaction",
    type: transaction.type,
    spaceId: transaction.spaceId,
    spaceName: transaction.spaceName,
    description: transaction.description,
    amount: normalizeTransactionAmount(transaction.type, transaction.amount),
    dueDate: transaction.dueDate.toISOString(),
  };
}

function serializeDashboardUpcomingPayment(
  payment: DashboardUpcomingPaymentRecord,
): DashboardUpcomingItem {
  return payment.kind === "transaction"
    ? serializeDashboardUpcomingTransaction(payment)
    : serializeDashboardCreditCardSettlement(payment);
}

function serializeTransactionDetail(
  transaction: TransactionWithSpaceRecord,
  mainSpaceId: string | null,
): TransactionDetailPayload {
  return {
    id: transaction.id,
    type: transaction.type,
    mainSpaceId,
    spaceId: transaction.spaceId,
    spaceName: transaction.space.name,
    transferSpaceId: transaction.transferSpaceId,
    transferSpaceName: transaction.transferSpace?.name || null,
    description: transaction.description,
    amount: normalizeTransactionAmount(transaction.type, transaction.amount),
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
  };
}

function serializeDashboardDateRange(
  monthStart: Date,
  monthEnd: Date,
): DashboardDateRange {
  return {
    startDate: format(monthStart, "yyyy-MM-dd"),
    endDate: format(monthEnd, "yyyy-MM-dd"),
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

    existing.transactions.push(
      serializeProjectionMonthTransactionRow(transaction),
    );
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

export async function getProjectionHeaderPayloadForUser(
  userAccountId: string,
  focusedMonthStart: Date,
): Promise<ProjectionHeaderPayload> {
  const projectionData = await Transaction.getProjectionHeaderQueryData(
    userAccountId,
    focusedMonthStart,
  );

  return {
    focusedMonthKey: formatProjectionMonthKey(
      projectionData.normalizedFocusedMonthStart,
    ),
    previousMonthKey: formatProjectionMonthKey(
      addMonths(projectionData.normalizedFocusedMonthStart, -1),
    ),
    nextMonthKey: formatProjectionMonthKey(
      addMonths(projectionData.normalizedFocusedMonthStart, 1),
    ),
    focusedMonthTotals: projectionData.focusedMonthTotals,
  };
}

export async function getProjectionChartPayloadForUser(
  userAccountId: string,
  focusedMonthStart: Date,
): Promise<ProjectionChartPayload> {
  const projectionData = await Transaction.getProjectionChartQueryData(
    userAccountId,
    focusedMonthStart,
  );

  const chartMonths: ProjectionChartMonth[] = projectionData.chartRows.map(
    (row) => {
      const income = Number(row.income || 0);
      const expense = Number(row.expense || 0);

      return {
        monthKey: row.monthKey,
        income,
        expense,
        net: income + expense,
      };
    },
  );

  return {
    focusedMonthKey: formatProjectionMonthKey(
      projectionData.normalizedFocusedMonthStart,
    ),
    chartMonths,
  };
}

export async function getProjectionSpacesPayloadForUser(
  userAccountId: string,
  focusedMonthStart: Date,
): Promise<ProjectionSpacesPayload> {
  const projectionData = await Transaction.getProjectionSpacesQueryData(
    userAccountId,
    focusedMonthStart,
  );

  return {
    focusedMonthKey: formatProjectionMonthKey(
      projectionData.normalizedFocusedMonthStart,
    ),
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
      serializeDashboardUpcomingPayment,
    ),
    currentMonthRange: serializeDashboardDateRange(
      dashboardData.monthStart,
      dashboardData.monthEnd,
    ),
  };
}

export async function getDashboardHeaderPayloadForUser(
  userAccountId: string,
): Promise<DashboardHeaderPayload> {
  const dashboardData =
    await Transaction.getDashboardHeaderQueryData(userAccountId);

  return {
    totals: dashboardData.totals,
    currentMonthRange: serializeDashboardDateRange(
      dashboardData.monthStart,
      dashboardData.monthEnd,
    ),
  };
}

export async function getDashboardUpcomingPayloadForUser(
  userAccountId: string,
): Promise<DashboardUpcomingPayload> {
  const dashboardData =
    await Transaction.getDashboardUpcomingQueryData(userAccountId);

  return {
    upcomingRange: serializeDashboardDateRange(
      dashboardData.monthStart,
      dashboardData.monthEnd,
    ),
    upcomingPayments: dashboardData.upcomingPayments.map(
      serializeDashboardUpcomingPayment,
    ),
  };
}

export async function getDashboardRecentActivityPayloadForUser(
  userAccountId: string,
): Promise<DashboardRecentActivityPayload> {
  const dashboardData =
    await Transaction.getDashboardRecentActivityQueryData(userAccountId);

  return {
    currentMonthRange: serializeDashboardDateRange(
      dashboardData.monthStart,
      dashboardData.monthEnd,
    ),
    recentTransactions: dashboardData.recentTransactions.map(
      serializeDashboardTransaction,
    ),
  };
}

export async function getTransactionsPagePayloadForUser(
  userAccountId: string,
  filters: TransactionFiltersInput,
): Promise<TransactionsPagePayload> {
  const [result, spaces] = await Promise.all([
    Transaction.getFilteredTransactionsForUser(userAccountId, filters),
    Space.listActiveByUser(userAccountId),
  ]);

  return {
    spaces: spaces.map((space) => {
      const spaceRecord = space.toRecord();

      return {
        id: spaceRecord.id,
        name: spaceRecord.name,
      };
    }),
    transactions: result.transactions.map(serializeFilteredTransaction),
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  };
}

export async function getTransactionDetailPayloadForUser(
  userAccountId: string,
  id: string,
): Promise<TransactionDetailPayload | null> {
  const [transaction, mainSpace] = await Promise.all([
    Transaction.findWithSpaceByIdForUser(userAccountId, id),
    Space.findMainByUser(userAccountId),
  ]);

  if (!transaction) {
    return null;
  }

  return serializeTransactionDetail(
    transaction,
    mainSpace?.toRecord().id || null,
  );
}

export async function getNewTransactionRecentPayloadForUser(
  userAccountId: string,
): Promise<NewTransactionRecentPayload> {
  const transactions = await Transaction.listRecentByUser(userAccountId, 5);

  return {
    recentTransactions: transactions.map(serializeDashboardTransaction),
  };
}

export async function getNewTransactionSpacesPayloadForUser(
  userAccountId: string,
): Promise<NewTransactionSpacesPayload> {
  const spaces = await Space.listActiveByUser(userAccountId);

  return {
    spaces: spaces.map((space) => {
      const spaceRecord = space.toRecord();

      return {
        id: spaceRecord.id,
        name: spaceRecord.name,
        main: spaceRecord.main,
      };
    }),
  };
}

export async function getNewTransferSpacesPayloadForUser(
  userAccountId: string,
): Promise<NewTransferSpacesPayload> {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(monthStart);
  const spaces = await Space.listByArchiveStateWithMonthTotals(
    userAccountId,
    false,
    monthStart,
    monthEnd,
  );

  return {
    spaces: spaces.map((space) => ({
      id: space.id,
      name: space.name,
      currentMonthTotal: space.currentMonthTotal,
    })),
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
      ["failed_to_update_transaction", "space_is_archived"].includes(
        error.message,
      )
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
