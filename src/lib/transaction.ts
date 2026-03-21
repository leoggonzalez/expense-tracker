import { Prisma } from "@prisma/client";
import {
  addMonths,
  endOfDay,
  endOfMonth,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import { Space } from "@/lib/space";

export type CreateTransactionInput = {
  type: "income" | "expense";
  spaceName: string;
  description: string;
  amount: number;
  beginDate: Date;
  endDate?: Date | null;
};

export type CreateTransferInput = {
  fromSpaceId: string;
  toSpaceId: string;
  description: string;
  amount: number;
  beginDate: Date;
};

export type TransactionBaseData = {
  type: string;
  spaceId: string;
  transferSpaceId: string | null;
  description: string;
  amount: number;
  beginDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TransactionPersistedData = TransactionBaseData & {
  id: string;
};

export type TransactionCreateData = Pick<
  TransactionBaseData,
  "type" | "spaceId" | "description" | "amount" | "beginDate"
> &
  Partial<
    Pick<
      TransactionBaseData,
      "transferSpaceId" | "endDate" | "createdAt" | "updatedAt"
    >
  >;

export type TransactionRecord = TransactionPersistedData;

const transactionWithSpaceInclude =
  Prisma.validator<Prisma.TransactionInclude>()({
    space: true,
    transferSpace: {
      select: {
        id: true,
        name: true,
      },
    },
  });

const filteredTransactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
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
});

export type TransactionWithSpaceRecord = Prisma.TransactionGetPayload<{
  include: typeof transactionWithSpaceInclude;
}>;

export type FilteredTransactionRecord = Prisma.TransactionGetPayload<{
  select: typeof filteredTransactionSelect;
}>;

export type DashboardTotals = {
  income: number;
  expense: number;
  net: number;
};

export type TransactionFiltersInput = {
  spaceId?: string;
  type?: "income" | "expense" | "transfer";
  date?: Date;
  description?: string;
  searchTerms?: string[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
};

type TransactionFiltersWhere = {
  space: {
    userAccountId: string;
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

export type ProjectionFocusedSpaceSummaryRow = {
  spaceId: string;
  spaceName: string;
  monthTotal: number | null;
  monthTransactionCount: number | null;
};

export type ProjectionFocusedSpaceTransactionRow = {
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

export type ProjectionQueryData = {
  normalizedFocusedMonthStart: Date;
  chartRows: ProjectionChartMonthRow[];
  focusedMonthTotals: DashboardTotals;
  spaceSummaryRows: ProjectionFocusedSpaceSummaryRow[];
  spaceTransactionsRows: ProjectionFocusedSpaceTransactionRow[];
};

export type DashboardQueryData = {
  totals: DashboardTotals;
  recentTransactions: TransactionWithSpaceRecord[];
  upcomingPayments: TransactionWithSpaceRecord[];
  monthStart: Date;
  monthEnd: Date;
};

export type DashboardHeaderQueryData = {
  totals: DashboardTotals;
  monthStart: Date;
  monthEnd: Date;
};

export type DashboardUpcomingQueryData = {
  upcomingPayments: TransactionWithSpaceRecord[];
  monthStart: Date;
  monthEnd: Date;
};

export type DashboardRecentActivityQueryData = {
  recentTransactions: TransactionWithSpaceRecord[];
  monthStart: Date;
  monthEnd: Date;
};

export type FilteredTransactionsQueryData = {
  transactions: FilteredTransactionRecord[];
  total: number;
  page: number;
  limit: number;
};

export class Transaction {
  public data: TransactionCreateData | TransactionPersistedData;

  public constructor(data: TransactionCreateData | TransactionPersistedData) {
    this.data = {
      transferSpaceId: null,
      endDate: null,
      ...data,
    };
  }

  public async create(): Promise<Transaction> {
    const record = await prisma.transaction.create({
      data: {
        type: this.data.type,
        spaceId: this.data.spaceId,
        transferSpaceId: this.data.transferSpaceId ?? null,
        description: this.data.description,
        amount: this.data.amount,
        beginDate: this.data.beginDate,
        endDate: this.data.endDate ?? null,
      },
    });

    return Transaction.fromRecord(record);
  }

  public async update(
    input: Partial<
      Pick<
        TransactionPersistedData,
        "type" | "spaceId" | "description" | "amount" | "beginDate" | "endDate"
      >
    >,
  ): Promise<Transaction> {
    const record = await prisma.transaction.update({
      where: { id: this.persistedId },
      data: {
        ...(input.type && { type: input.type }),
        ...(input.spaceId && { spaceId: input.spaceId }),
        ...(input.description && { description: input.description }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.beginDate && { beginDate: input.beginDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
      },
    });

    return Transaction.fromRecord(record);
  }

  public async delete(): Promise<void> {
    await prisma.transaction.delete({
      where: { id: this.persistedId },
    });
  }

  public get persistedId(): string {
    return this.requirePersistedId();
  }

  public toRecord(): TransactionPersistedData {
    if (!("id" in this.data) || !this.data.id) {
      throw new Error("transaction_id_required");
    }

    return {
      id: this.data.id,
      type: this.data.type,
      spaceId: this.data.spaceId,
      transferSpaceId: this.data.transferSpaceId ?? null,
      description: this.data.description,
      amount: this.data.amount,
      beginDate: this.data.beginDate,
      endDate: this.data.endDate ?? null,
      createdAt: this.requirePersistedDate(this.data.createdAt),
      updatedAt: this.requirePersistedDate(this.data.updatedAt),
    };
  }

  public static async syncAllCurrentMonthSpaceCounters(): Promise<void> {
    await Space.syncAllCurrentMonthTransactionCounts();
  }

  public static async createForUser(
    userAccountId: string,
    input: CreateTransactionInput,
  ): Promise<TransactionWithSpaceRecord> {
    const space = await Space.findOrCreateActive(
      userAccountId,
      input.spaceName,
    );
    const transaction = await prisma.transaction.create({
      data: {
        type: input.type,
        spaceId: space.persistedId,
        transferSpaceId: null,
        description: input.description,
        amount: input.amount,
        beginDate: input.beginDate,
        endDate: input.endDate || null,
      },
      include: transactionWithSpaceInclude,
    });

    await Space.syncCurrentMonthTransactionCount(space.persistedId);

    return transaction;
  }

  public static async createTransferForUser(
    userAccountId: string,
    input: CreateTransferInput,
  ): Promise<TransactionWithSpaceRecord[]> {
    if (input.fromSpaceId === input.toSpaceId) {
      throw new Error("transfer_same_space");
    }

    const absoluteAmount = Math.abs(input.amount);

    if (!Number.isFinite(absoluteAmount) || absoluteAmount <= 0) {
      throw new Error("invalid_transfer_amount");
    }

    const [fromSpace, toSpace] = await Promise.all([
      Space.findOwnedById(userAccountId, input.fromSpaceId),
      Space.findOwnedById(userAccountId, input.toSpaceId),
    ]);

    if (
      !fromSpace ||
      !toSpace ||
      fromSpace.data.isArchived ||
      toSpace.data.isArchived
    ) {
      throw new Error("invalid_transfer_spaces");
    }

    const endDate = new Date(input.beginDate);

    const [fromTransaction, toTransaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: "expense",
          spaceId: fromSpace.persistedId,
          transferSpaceId: toSpace.persistedId,
          description: input.description,
          amount: -absoluteAmount,
          beginDate: input.beginDate,
          endDate,
        },
        include: transactionWithSpaceInclude,
      }),
      prisma.transaction.create({
        data: {
          type: "income",
          spaceId: toSpace.persistedId,
          transferSpaceId: fromSpace.persistedId,
          description: input.description,
          amount: absoluteAmount,
          beginDate: input.beginDate,
          endDate,
        },
        include: transactionWithSpaceInclude,
      }),
    ]);

    await Space.syncCurrentMonthTransactionCounts([
      fromSpace.persistedId,
      toSpace.persistedId,
    ]);

    return [fromTransaction, toTransaction];
  }

  public static async createManyForUser(
    userAccountId: string,
    inputs: CreateTransactionInput[],
  ): Promise<TransactionWithSpaceRecord[]> {
    const results: TransactionWithSpaceRecord[] = [];

    for (const input of inputs) {
      results.push(await Transaction.createForUser(userAccountId, input));
    }

    return results;
  }

  public static async findOwnedById(
    userAccountId: string,
    id: string,
  ): Promise<Transaction | null> {
    const record = await prisma.transaction.findFirst({
      where: {
        id,
        space: {
          userAccountId,
        },
      },
    });

    return record ? Transaction.fromRecord(record) : null;
  }

  public static async findWithSpaceByIdForUser(
    userAccountId: string,
    id: string,
  ): Promise<TransactionWithSpaceRecord | null> {
    return prisma.transaction.findFirst({
      where: {
        id,
        space: {
          userAccountId,
        },
      },
      include: transactionWithSpaceInclude,
    });
  }

  public static async listByUser(
    userAccountId: string,
  ): Promise<TransactionWithSpaceRecord[]> {
    return prisma.transaction.findMany({
      where: {
        space: {
          userAccountId,
        },
      },
      include: transactionWithSpaceInclude,
      orderBy: [{ space: { name: "asc" } }, { beginDate: "asc" }],
    });
  }

  public static async listRecentByUser(
    userAccountId: string,
    limit: number,
  ): Promise<TransactionWithSpaceRecord[]> {
    return prisma.transaction.findMany({
      where: {
        space: {
          userAccountId,
        },
      },
      include: transactionWithSpaceInclude,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  }

  public static async getMonthTotalsForUser(
    userAccountId: string,
    monthStartInput: Date,
  ): Promise<DashboardTotals> {
    const monthStart = startOfMonth(monthStartInput);
    const monthEnd = endOfMonth(monthStart);

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
        WHERE a."userAccountId" = ${userAccountId}
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
  }

  public static async getProjectionQueryData(
    userAccountId: string,
    focusedMonthStart: Date,
  ): Promise<ProjectionQueryData> {
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
         AND a."userAccountId" = ${userAccountId}
        GROUP BY months.month_start
        ORDER BY months.month_start ASC
      `,
      Transaction.getMonthTotalsForUser(
        userAccountId,
        normalizedFocusedMonthStart,
      ),
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
          ) AS "monthTotal",
          CASE
            WHEN ${focusedMonthIsCurrent} THEN a."currentMonthTransactionCount"
            ELSE COUNT(e.id)::integer
          END AS "monthTransactionCount"
        FROM "Space" a
        INNER JOIN "Transaction" e ON e."spaceId" = a.id
        WHERE a."userAccountId" = ${userAccountId}
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
          WHERE a."userAccountId" = ${userAccountId}
            AND e."beginDate" <= ${focusedMonthEnd}
            AND (e."endDate" IS NULL OR e."endDate" >= ${normalizedFocusedMonthStart})
        ) ranked
        WHERE ranked.row_number <= 5
        ORDER BY ranked."spaceName" ASC, ranked."beginDate" DESC, ranked."createdAt" DESC
      `,
    ]);

    return {
      normalizedFocusedMonthStart,
      chartRows,
      focusedMonthTotals,
      spaceSummaryRows,
      spaceTransactionsRows,
    };
  }

  public static async getDashboardQueryData(
    userAccountId: string,
  ): Promise<DashboardQueryData> {
    const [headerData, recentActivityData, upcomingData] = await Promise.all([
      Transaction.getDashboardHeaderQueryData(userAccountId),
      Transaction.getDashboardRecentActivityQueryData(userAccountId),
      Transaction.getDashboardUpcomingQueryData(userAccountId),
    ]);

    return {
      totals: headerData.totals,
      recentTransactions: recentActivityData.recentTransactions,
      upcomingPayments: upcomingData.upcomingPayments,
      monthStart: headerData.monthStart,
      monthEnd: headerData.monthEnd,
    };
  }

  public static async getDashboardHeaderQueryData(
    userAccountId: string,
  ): Promise<DashboardHeaderQueryData> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const totals = await Transaction.getMonthTotalsForUser(
      userAccountId,
      monthStart,
    );

    return {
      totals,
      monthStart,
      monthEnd,
    };
  }

  public static async getDashboardUpcomingQueryData(
    userAccountId: string,
  ): Promise<DashboardUpcomingQueryData> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const today = startOfDay(now);
    const upcomingPayments = await prisma.transaction.findMany({
      where: {
        type: "expense",
        transferSpaceId: null,
        space: {
          userAccountId,
        },
        beginDate: {
          gte: today,
          lte: monthEnd,
        },
      },
      include: transactionWithSpaceInclude,
      orderBy: [{ beginDate: "asc" }, { createdAt: "desc" }],
      take: 6,
    });

    return {
      upcomingPayments,
      monthStart,
      monthEnd,
    };
  }

  public static async getDashboardRecentActivityQueryData(
    userAccountId: string,
  ): Promise<DashboardRecentActivityQueryData> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const recentTransactions = await Transaction.listRecentByUser(
      userAccountId,
      10,
    );

    return {
      recentTransactions,
      monthStart,
      monthEnd,
    };
  }

  public static async getFilteredTransactionsForUser(
    userAccountId: string,
    filters: TransactionFiltersInput,
  ): Promise<FilteredTransactionsQueryData> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: TransactionFiltersWhere = {
      space: {
        userAccountId,
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
        select: filteredTransactionSelect,
        orderBy: {
          beginDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page,
      limit,
    };
  }

  public static async updateForUser(
    userAccountId: string,
    id: string,
    input: Partial<CreateTransactionInput>,
  ): Promise<TransactionWithSpaceRecord> {
    const existingTransaction = await Transaction.findOwnedById(
      userAccountId,
      id,
    );

    if (!existingTransaction) {
      throw new Error("failed_to_update_transaction");
    }

    let spaceId: string | undefined;

    if (input.spaceName) {
      const space = await Space.findOrCreateActive(
        userAccountId,
        input.spaceName,
      );
      spaceId = space.persistedId;
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(input.type && { type: input.type }),
        ...(spaceId && { spaceId }),
        ...(input.description && { description: input.description }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.beginDate && { beginDate: input.beginDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
      },
      include: transactionWithSpaceInclude,
    });

    await Space.syncCurrentMonthTransactionCounts([
      existingTransaction.data.spaceId,
      updatedTransaction.spaceId,
    ]);

    return updatedTransaction;
  }

  public static async deleteForUser(
    userAccountId: string,
    id: string,
  ): Promise<void> {
    const existingTransaction = await Transaction.findOwnedById(
      userAccountId,
      id,
    );

    if (!existingTransaction) {
      throw new Error("failed_to_delete_transaction");
    }

    await existingTransaction.delete();
    await Space.syncCurrentMonthTransactionCount(
      existingTransaction.data.spaceId,
    );
  }

  private static fromRecord(record: TransactionPersistedData): Transaction {
    return new Transaction(record);
  }

  private requirePersistedId(): string {
    if (!("id" in this.data) || !this.data.id) {
      throw new Error("transaction_id_required");
    }

    return this.data.id;
  }

  private requirePersistedDate(value: Date | undefined): Date {
    if (!value) {
      throw new Error("transaction_date_required");
    }

    return value;
  }
}
