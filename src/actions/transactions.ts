"use server";

import {
  addMonths,
  endOfDay,
  endOfMonth,
  format,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface CreateTransactionInput {
  type: "income" | "expense";
  spaceName: string;
  description: string;
  amount: number;
  beginDate: Date;
  endDate?: Date | null;
}

export interface CreateTransferInput {
  fromSpaceId: string;
  toSpaceId: string;
  description: string;
  amount: number;
  beginDate: Date;
}

type SpaceRecord = {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type TransactionWithSpaceRecord = {
  id: string;
  type: string;
  spaceId: string;
  transferSpaceId: string | null;
  description: string;
  amount: number;
  beginDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  space: SpaceRecord;
  transferSpace?: {
    id: string;
    name: string;
  } | null;
};

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

export type DashboardTotals = {
  income: number;
  expense: number;
  net: number;
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

type TransactionFiltersWhere = {
  space: {
    userId: string;
  };
  spaceId?: string;
  type?: "income" | "expense";
  transferSpaceId?: {
    not?: null;
  } | null;
  AND?: Array<{
    description: {
      contains: string;
      mode: "insensitive";
    };
  }>;
  beginDate?: {
    gte?: Date;
    lte?: Date;
  };
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

type MonthTotalsRow = {
  income: number | null;
  expense: number | null;
  net: number | null;
};

type ProjectionChartMonthRow = {
  monthKey: string;
  income: number | null;
  expense: number | null;
};

type ProjectionFocusedSpaceAccumulator = {
  spaceId: string;
  spaceName: string;
  monthTotal: number;
  monthTransactionCount: number;
  transactions: ProjectionMonthTransaction[];
};

type ProjectionFocusedSpaceSummaryRow = {
  spaceId: string;
  spaceName: string;
  monthTotal: number | null;
  monthTransactionCount: number | null;
};

type ProjectionFocusedSpaceTransactionRow = {
  spaceId: string;
  spaceName: string;
  id: string;
  type: string;
  transferSpaceId: string | null;
  transferSpaceName: string | null;
  description: string;
  amount: number;
  beginDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeTransactionAmount(type: string, amount: number): number {
  if (type === "expense" && amount > 0) {
    return -amount;
  }

  return amount;
}

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

function getCurrentMonthBounds(): { monthStart: Date; monthEnd: Date } {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(monthStart);

  return { monthStart, monthEnd };
}

async function syncCurrentMonthTransactionCounterForSpace(
  spaceId: string,
): Promise<void> {
  const { monthStart, monthEnd } = getCurrentMonthBounds();

  await prisma.$executeRaw`
    UPDATE "Space" a
    SET "currentMonthTransactionCount" = (
      SELECT COUNT(e.id)::integer
      FROM "Transaction" e
      WHERE e."spaceId" = a.id
        AND e."beginDate" <= ${monthEnd}
        AND (e."endDate" IS NULL OR e."endDate" >= ${monthStart})
    )
    WHERE a.id = ${spaceId}
  `;
}

async function syncCurrentMonthTransactionCounterForSpaces(
  spaceIds: string[],
): Promise<void> {
  const uniqueSpaceIds = Array.from(new Set(spaceIds.filter(Boolean)));

  if (uniqueSpaceIds.length === 0) {
    return;
  }

  await Promise.all(
    uniqueSpaceIds.map((spaceId) =>
      syncCurrentMonthTransactionCounterForSpace(spaceId),
    ),
  );
}

export async function syncAllCurrentMonthTransactionCounters(): Promise<void> {
  const { monthStart, monthEnd } = getCurrentMonthBounds();

  await prisma.$executeRaw`
    UPDATE "Space" a
    SET "currentMonthTransactionCount" = COALESCE(month_counts."transactionCount", 0)
    FROM (
      SELECT
        a2.id AS "spaceId",
        COUNT(e.id)::integer AS "transactionCount"
      FROM "Space" a2
      LEFT JOIN "Transaction" e
        ON e."spaceId" = a2.id
       AND e."beginDate" <= ${monthEnd}
       AND (e."endDate" IS NULL OR e."endDate" >= ${monthStart})
      GROUP BY a2.id
    ) month_counts
    WHERE a.id = month_counts."spaceId"
  `;
}

async function getMonthTotalsForUser(
  userId: string,
  monthStartInput: Date,
): Promise<DashboardTotals> {
  const monthStart = startOfMonth(monthStartInput);
  const monthEnd = endOfMonth(monthStart);

  try {
    const rows = await prisma.$queryRaw<MonthTotalsRow[]>`
      SELECT
        totals.income,
        totals.expense,
        totals.income + totals.expense AS net
      FROM (
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN e.type = 'income' THEN e.amount
                ELSE 0
              END
            ),
            0
          ) AS income,
          COALESCE(
            SUM(
              CASE
                WHEN e.type = 'expense' THEN
                  CASE
                    WHEN e.amount > 0 THEN -e.amount
                    ELSE e.amount
                  END
                ELSE 0
              END
            ),
            0
          ) AS expense
        FROM "Transaction" e
        INNER JOIN "Space" a ON a.id = e."spaceId"
        WHERE a."userId" = ${userId}
          AND e."transferSpaceId" IS NULL
          AND e."beginDate" <= ${monthEnd}
          AND (e."endDate" IS NULL OR e."endDate" >= ${monthStart})
      ) AS totals
    `;

    const totals = rows[0];

    return {
      income: Number(totals?.income || 0),
      expense: Number(totals?.expense || 0),
      net: Number(totals?.net || 0),
    };
  } catch (error) {
    console.error("Error fetching month totals:", error);
    return {
      income: 0,
      expense: 0,
      net: 0,
    };
  }
}

export async function getMonthTotals(
  monthStart: Date,
): Promise<DashboardTotals> {
  const currentUser = await requireCurrentUser();
  return getMonthTotalsForUser(currentUser.id, monthStart);
}

async function findOrCreateSpace(userId: string, spaceName: string) {
  let space = await prisma.space.findFirst({
    where: {
      userId,
      name: spaceName,
      isArchived: false,
    },
  });

  if (!space) {
    const archivedSpace = await prisma.space.findFirst({
      where: {
        userId,
        name: spaceName,
        isArchived: true,
      },
      select: {
        id: true,
      },
    });

    if (archivedSpace) {
      throw new Error("space_is_archived");
    }

    space = await prisma.space.create({
      data: {
        userId,
        name: spaceName,
      },
    });
  }

  return space;
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

function serializeDashboardRecentTransaction(transaction: TransactionWithSpaceRecord) {
  const normalizedAmount = normalizeTransactionAmount(transaction.type, transaction.amount);

  return {
    id: transaction.id,
    type: transaction.type,
    spaceName: transaction.space.name,
    description: transaction.description,
    amount: normalizedAmount,
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
    transferSpaceId: transaction.transferSpaceId,
    transferSpaceName: transaction.transferSpace?.name || null,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

function revalidateTransactionPages() {
  revalidatePath("/");
  revalidatePath("/projection");
  revalidatePath("/transactions");
  revalidatePath("/transactions/all");
  revalidatePath("/space");
  revalidatePath("/settings");
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<TransactionMutationResult> {
  const currentUser = await requireCurrentUser();

  try {
    const space = await findOrCreateSpace(
      currentUser.id,
      input.spaceName,
    );

    const transaction = await prisma.transaction.create({
      data: {
        type: input.type,
        spaceId: space.id,
        transferSpaceId: null,
        description: input.description,
        amount: input.amount,
        beginDate: input.beginDate,
        endDate: input.endDate || null,
      },
      include: {
        space: true,
      },
    });

    await syncCurrentMonthTransactionCounterForSpace(space.id);
    revalidateTransactionPages();

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
  const currentUser = await requireCurrentUser();

  if (input.fromSpaceId === input.toSpaceId) {
    return { success: false, error: "transfer_same_space" };
  }

  const absoluteAmount = Math.abs(input.amount);

  if (!Number.isFinite(absoluteAmount) || absoluteAmount <= 0) {
    return { success: false, error: "invalid_transfer_amount" };
  }

  try {
    const [fromSpace, toSpace] = await Promise.all([
      prisma.space.findFirst({
        where: {
          id: input.fromSpaceId,
          userId: currentUser.id,
          isArchived: false,
        },
      }),
      prisma.space.findFirst({
        where: {
          id: input.toSpaceId,
          userId: currentUser.id,
          isArchived: false,
        },
      }),
    ]);

    if (!fromSpace || !toSpace) {
      return { success: false, error: "invalid_transfer_spaces" };
    }

    const endDate = new Date(input.beginDate);

    const [fromTransaction, toTransaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: "expense",
          spaceId: fromSpace.id,
          transferSpaceId: toSpace.id,
          description: input.description,
          amount: -absoluteAmount,
          beginDate: input.beginDate,
          endDate,
        },
        include: {
          space: true,
        },
      }),
      prisma.transaction.create({
        data: {
          type: "income",
          spaceId: toSpace.id,
          transferSpaceId: fromSpace.id,
          description: input.description,
          amount: absoluteAmount,
          beginDate: input.beginDate,
          endDate,
        },
        include: {
          space: true,
        },
      }),
    ]);

    await syncCurrentMonthTransactionCounterForSpaces([
      fromSpace.id,
      toSpace.id,
    ]);
    revalidateTransactionPages();

    return { success: true, transactions: [fromTransaction, toTransaction] };
  } catch (error) {
    console.error("Error creating transfer transaction:", error);
    return { success: false, error: "failed_to_create_transfer" };
  }
}

export async function createMultipleTransactions(
  inputs: CreateTransactionInput[],
): Promise<MultipleTransactionMutationResult> {
  try {
    const results: TransactionWithSpaceRecord[] = [];

    for (const input of inputs) {
      const result = await createTransaction(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      results.push(result.transaction);
    }

    return { success: true, transactions: results };
  } catch (error) {
    console.error("Error creating multiple transactions:", error);
    return { success: false, error: "failed_to_create_transactions" };
  }
}

export async function getTransactions(): Promise<TransactionWithSpaceRecord[]> {
  const currentUser = await requireCurrentUser();

  try {
    return await prisma.transaction.findMany({
      where: {
        space: {
          userId: currentUser.id,
        },
      },
      include: {
        space: true,
      },
      orderBy: [{ space: { name: "asc" } }, { beginDate: "asc" }],
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function getRecentTransactions(
  limit: number = 10,
): Promise<TransactionWithSpaceRecord[]> {
  const currentUser = await requireCurrentUser();

  try {
    return await prisma.transaction.findMany({
      where: {
        space: {
          userId: currentUser.id,
        },
      },
      include: {
        space: true,
        transferSpace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return [];
  }
}

export async function getCurrentMonthTotals(): Promise<DashboardTotals> {
  return getMonthTotals(new Date());
}

export async function getProjectionTransactions(): Promise<
  SerializedProjectionTransaction[]
> {
  const transactions = await getTransactions();
  return transactions.map(serializeProjectionTransaction);
}

export async function getProjectionPagePayload(
  focusedMonthStart: Date,
): Promise<ProjectionPagePayload> {
  const currentUser = await requireCurrentUser();
  const normalizedFocusedMonthStart = startOfMonth(focusedMonthStart);
  const endMonthStart = addMonths(normalizedFocusedMonthStart, 5);
  const focusedMonthEnd = endOfMonth(normalizedFocusedMonthStart);
  const focusedMonthIsCurrent = isSameMonth(
    normalizedFocusedMonthStart,
    startOfMonth(new Date()),
  );

  const [
    chartRows,
    focusedMonthTotals,
    spaceSummaryRows,
    spaceTransactionsRows,
  ] = await Promise.all([
    prisma.$queryRaw<ProjectionChartMonthRow[]>`
      WITH months AS (
        SELECT generate_series(
          ${normalizedFocusedMonthStart}::timestamp,
          ${endMonthStart}::timestamp,
          interval '1 month'
        ) AS month_start
      )
      SELECT
        to_char(months.month_start, 'YYYY-MM') AS "monthKey",
        COALESCE(
          SUM(
            CASE
              WHEN a.id IS NOT NULL AND e.type = 'income' THEN e.amount
              ELSE 0
            END
          ),
          0
        ) AS income,
        COALESCE(
          SUM(
            CASE
              WHEN a.id IS NOT NULL AND e.type = 'expense' THEN
                CASE
                  WHEN e.amount > 0 THEN -e.amount
                  ELSE e.amount
                END
              ELSE 0
            END
          ),
          0
        ) AS expense
      FROM months
      LEFT JOIN "Transaction" e
        ON e."beginDate" <= (months.month_start + interval '1 month - 1 millisecond')
       AND (e."endDate" IS NULL OR e."endDate" >= months.month_start)
       AND e."transferSpaceId" IS NULL
      LEFT JOIN "Space" a
        ON a.id = e."spaceId"
       AND a."userId" = ${currentUser.id}
      GROUP BY months.month_start
      ORDER BY months.month_start ASC
    `,
    getMonthTotalsForUser(currentUser.id, normalizedFocusedMonthStart),
    prisma.$queryRaw<ProjectionFocusedSpaceSummaryRow[]>`
      SELECT
        a.id AS "spaceId",
        a.name AS "spaceName",
        COALESCE(
          SUM(
            CASE
              WHEN e.type = 'expense' THEN
                CASE
                  WHEN e.amount > 0 THEN -e.amount
                  ELSE e.amount
                END
              ELSE e.amount
            END
          ),
          0
        ) AS "monthTotal"
        ,
        CASE
          WHEN ${focusedMonthIsCurrent} THEN a."currentMonthTransactionCount"
          ELSE COUNT(e.id)::integer
        END AS "monthTransactionCount"
      FROM "Space" a
      INNER JOIN "Transaction" e ON e."spaceId" = a.id
      WHERE a."userId" = ${currentUser.id}
        AND e."beginDate" <= ${focusedMonthEnd}
        AND (e."endDate" IS NULL OR e."endDate" >= ${normalizedFocusedMonthStart})
      GROUP BY a.id, a.name, a."currentMonthTransactionCount"
      ORDER BY a.name ASC
    `,
    prisma.$queryRaw<ProjectionFocusedSpaceTransactionRow[]>`
      SELECT
        ranked."spaceId",
        ranked."spaceName",
        ranked.id,
        ranked.type,
        ranked."transferSpaceId",
        ranked."transferSpaceName",
        ranked.description,
        ranked.amount,
        ranked."beginDate",
        ranked."endDate",
        ranked."createdAt",
        ranked."updatedAt"
      FROM (
        SELECT
          a.id AS "spaceId",
          a.name AS "spaceName",
          e.id,
          e.type,
          e."transferSpaceId",
          transfer_space.name AS "transferSpaceName",
          e.description,
          e.amount,
          e."beginDate",
          e."endDate",
          e."createdAt",
          e."updatedAt",
          ROW_NUMBER() OVER (
            PARTITION BY a.id
            ORDER BY e."beginDate" DESC, e."createdAt" DESC
          ) AS row_number
        FROM "Space" a
        INNER JOIN "Transaction" e ON e."spaceId" = a.id
        LEFT JOIN "Space" transfer_space
          ON transfer_space.id = e."transferSpaceId"
        WHERE a."userId" = ${currentUser.id}
          AND e."beginDate" <= ${focusedMonthEnd}
          AND (e."endDate" IS NULL OR e."endDate" >= ${normalizedFocusedMonthStart})
      ) ranked
      WHERE ranked.row_number <= 5
      ORDER BY ranked."spaceName" ASC, ranked."beginDate" DESC, ranked."createdAt" DESC
    `,
  ]);

  const chartMonths: ProjectionChartMonth[] = chartRows.map((row, index) => {
    const monthStart = addMonths(normalizedFocusedMonthStart, index);
    const income = Number(row.income || 0);
    const expense = Number(row.expense || 0);

    return {
      monthKey: row.monthKey,
      monthLabel: format(monthStart, "MMMM yyyy"),
      income,
      expense,
      net: income + expense,
    };
  });

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

  return {
    focusedMonth: {
      key: format(normalizedFocusedMonthStart, "yyyy-MM"),
      label: format(normalizedFocusedMonthStart, "MMMM yyyy"),
    },
    previousMonthKey: format(
      addMonths(normalizedFocusedMonthStart, -1),
      "yyyy-MM",
    ),
    nextMonthKey: format(addMonths(normalizedFocusedMonthStart, 1), "yyyy-MM"),
    chartMonths,
    focusedMonthTotals,
    focusedMonthSpaces: Array.from(spaceMap.values())
      .sort((a, b) => a.spaceName.localeCompare(b.spaceName))
      .map((space) => ({
        spaceId: space.spaceId,
        spaceName: space.spaceName,
        monthTotal: space.monthTotal,
        monthTransactionCount: space.monthTransactionCount,
        transactions: space.transactions,
      })),
  };
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const today = startOfDay(now);
  const currentUser = await requireCurrentUser();

  const [totals, recentTransactions, upcomingPayments] = await Promise.all([
    getMonthTotalsForUser(currentUser.id, monthStart),
    getRecentTransactions(10),
    prisma.transaction.findMany({
      where: {
        type: "expense",
        transferSpaceId: null,
        space: {
          userId: currentUser.id,
        },
        beginDate: {
          gte: today,
          lte: monthEnd,
        },
      },
      include: {
        space: true,
        transferSpace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ beginDate: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);

  return {
    totals,
    recentTransactions: recentTransactions.map(serializeDashboardRecentTransaction),
    upcomingPayments: upcomingPayments.map(serializeDashboardRecentTransaction),
    currentMonthRange: {
      startDate: format(monthStart, "yyyy-MM-dd"),
      endDate: format(monthEnd, "yyyy-MM-dd"),
    },
  };
}

export async function getTransactionsWithFilters(filters: {
  spaceId?: string;
  type?: "income" | "expense" | "transfer";
  date?: Date;
  description?: string;
  searchTerms?: string[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}): Promise<TransactionListWithPagination> {
  const currentUser = await requireCurrentUser();

  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: TransactionFiltersWhere = {
      space: {
        userId: currentUser.id,
      },
    };

    if (filters.spaceId) {
      where.spaceId = filters.spaceId;
    }

    if (filters.type === "transfer") {
      where.transferSpaceId = { not: null };
    } else if (filters.type) {
      where.type = filters.type;
      where.transferSpaceId = null;
    }

    const searchTerms = Array.from(
      new Set(
        [
          ...(filters.searchTerms || []),
          ...(filters.description ? [filters.description] : []),
        ]
          .map((term) => term.trim())
          .filter(Boolean),
      ),
    );

    if (searchTerms.length > 0) {
      where.AND = searchTerms.map((term) => ({
        description: {
          contains: term,
          mode: "insensitive",
        },
      }));
    }

    if (filters.date || filters.startDate || filters.endDate) {
      where.beginDate = {};

      let minDate = filters.startDate;
      let maxDate = filters.endDate;

      if (filters.date) {
        const exactDateStart = startOfDay(filters.date);
        const exactDateEnd = endOfDay(filters.date);
        minDate =
          !minDate || exactDateStart > minDate ? exactDateStart : minDate;
        maxDate = !maxDate || exactDateEnd < maxDate ? exactDateEnd : maxDate;
      }

      if (minDate) {
        where.beginDate.gte = minDate;
      }
      if (maxDate) {
        where.beginDate.lte = maxDate;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        select: {
          id: true,
          type: true,
          transferSpaceId: true,
          description: true,
          amount: true,
          beginDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          space: {
            select: {
              name: true,
            },
          },
          transferSpace: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          beginDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((transaction) => ({
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
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
  const currentUser = await requireCurrentUser();

  try {
    return await prisma.space.findMany({
      where: {
        userId: currentUser.id,
        isArchived: false,
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }
}

export async function getTransactionById(
  id: string,
): Promise<TransactionWithSpaceRecord | null> {
  const currentUser = await requireCurrentUser();

  try {
    return await prisma.transaction.findFirst({
      where: {
        id,
        space: {
          userId: currentUser.id,
        },
      },
      include: {
        space: true,
        transferSpace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
}

export async function updateTransaction(
  id: string,
  input: Partial<CreateTransactionInput>,
): Promise<TransactionMutationResult> {
  const currentUser = await requireCurrentUser();

  try {
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        space: {
          userId: currentUser.id,
        },
      },
      include: {
        space: true,
      },
    });

    if (!existingTransaction) {
      return { success: false, error: "failed_to_update_transaction" };
    }

    let spaceId: string | undefined;

    if (input.spaceName) {
      const space = await findOrCreateSpace(
        currentUser.id,
        input.spaceName,
      );
      spaceId = space.id;
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(input.type && { type: input.type }),
        ...(spaceId && { spaceId }),
        ...(input.description && { description: input.description }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.beginDate && { beginDate: input.beginDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
      },
      include: {
        space: true,
      },
    });

    await syncCurrentMonthTransactionCounterForSpaces([
      existingTransaction.spaceId,
      transaction.spaceId,
    ]);
    revalidateTransactionPages();

    return { success: true, transaction };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { success: false, error: "failed_to_update_transaction" };
  }
}

export async function deleteTransaction(id: string) {
  const currentUser = await requireCurrentUser();

  try {
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        space: {
          userId: currentUser.id,
        },
      },
      select: {
        id: true,
        spaceId: true,
      },
    });

    if (!existingTransaction) {
      return { success: false, error: "failed_to_delete_transaction" };
    }

    await prisma.transaction.delete({
      where: { id },
    });

    await syncCurrentMonthTransactionCounterForSpace(existingTransaction.spaceId);
    revalidateTransactionPages();

    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, error: "failed_to_delete_transaction" };
  }
}
