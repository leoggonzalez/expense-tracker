import {
  getMassEditBlockReason,
  serializeMassEditTransaction,
  type MassTransactionUpdate,
} from "@/lib/mass_transaction_edit";
import {
  deriveScheduleFromDates,
  resolveEndDate,
} from "@/lib/transaction_schedule";
import { normalizeTransactionAmount } from "@/lib/amount";
import {
  CreditCardPaymentTiming,
  Prisma,
  TransactionCategory,
  TransactionCategorySource,
} from "@prisma/client";
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";

import { SpaceMember } from "@/lib/space_member";
import { parseSplitParticipants } from "@/lib/transaction_split";
import {
  CategoryMatch,
  type CategoryMatchPatch,
  type CategoryMatchRecord,
} from "@/lib/category_match";
import { CategoryDefault } from "@/lib/category_default";
import {
  resolveTransactionCategory,
  type CategoryDefaultRule,
} from "@/lib/category_matching";

import { prisma } from "@/lib/prisma";
import { Space, type CreditCardSpaceRecord } from "@/lib/space";

/** Monthly category totals use positive magnitudes, counting each non-transfer occurrence once. */
export interface CategoryAllocation {
  category: TransactionCategory;
  amount: number;
  income: number;
  expense: number;
  transactionCount: number;
  type: "income" | "expense" | "mixed";
}

export interface CategoryAllocationSummary {
  categories: CategoryAllocation[];
  total: number;
  income: number;
  expense: number;
  transactionCount: number;
}

export type CreateTransactionInput = {
  participantIds?: string[];
  type: "income" | "expense";
  category?: TransactionCategory;
  categorySelection?: "manual" | "automatic";
  spaceName: string;
  spaceId?: string;
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
  splitParticipantIds?: string | null;
  type: string;
  category: TransactionCategory;
  categorySource: TransactionCategorySource;
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
      | "category"
      | "categorySource"
      | "transferSpaceId"
      | "endDate"
      | "createdAt"
      | "updatedAt"
      | "splitParticipantIds"
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

export type TransactionWithCategoryPatch = TransactionWithSpaceRecord & {
  categoryMatchPatch?: CategoryMatchPatch;
};

export type FilteredTransactionRecord = Prisma.TransactionGetPayload<{
  select: typeof filteredTransactionSelect;
}>;

export type DashboardTotals = {
  income: number;
  expense: number;
  net: number;
};

export type DashboardCreditCardSettlementRecord = {
  kind: "credit_card_settlement";
  id: string;
  spaceId: string;
  spaceName: string;
  description: string;
  amount: number;
  dueDate: Date;
  projectedMonthStart: Date;
  projectedMonthEnd: Date;
};

export type DashboardUpcomingTransactionRecord = {
  kind: "transaction";
  id: string;
  type: "income" | "expense";
  spaceId: string;
  spaceName: string;
  description: string;
  amount: number;
  dueDate: Date;
};

export type DashboardUpcomingPaymentRecord =
  | DashboardCreditCardSettlementRecord
  | DashboardUpcomingTransactionRecord;

export type TransactionFiltersInput = {
  spaceId?: string;
  category?: TransactionCategory;
  reportingMonth?: Date;
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
  id?: { in: string[] };
  category?: TransactionCategory;
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
  splitParticipantIds: string | null;
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

export type ProjectionHeaderQueryData = {
  normalizedFocusedMonthStart: Date;
  focusedMonthTotals: DashboardTotals;
};

export type ProjectionChartQueryData = {
  normalizedFocusedMonthStart: Date;
  chartRows: ProjectionChartMonthRow[];
};

export type ProjectionSpacesQueryData = {
  normalizedFocusedMonthStart: Date;
  spaceSummaryRows: ProjectionFocusedSpaceSummaryRow[];
  spaceTransactionsRows: ProjectionFocusedSpaceTransactionRow[];
};

export type DashboardQueryData = {
  totals: DashboardTotals;
  recentTransactions: TransactionWithSpaceRecord[];
  upcomingPayments: DashboardUpcomingPaymentRecord[];
  monthStart: Date;
  monthEnd: Date;
};

export type DashboardHeaderQueryData = {
  totals: DashboardTotals;
  monthStart: Date;
  monthEnd: Date;
};

export type DashboardUpcomingQueryData = {
  upcomingPayments: DashboardUpcomingPaymentRecord[];
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
      category: TransactionCategory.uncategorized,
      categorySource: TransactionCategorySource.fallback,
      ...data,
    };
  }

  public async create(): Promise<Transaction> {
    const record = await prisma.transaction.create({
      data: {
        splitParticipantIds: this.data.splitParticipantIds,
        type: this.data.type,
        category: this.data.category ?? TransactionCategory.uncategorized,
        categorySource:
          this.data.categorySource ?? TransactionCategorySource.fallback,
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
      splitParticipantIds: this.data.splitParticipantIds ?? null,
      id: this.data.id,
      type: this.data.type,
      category: this.data.category ?? TransactionCategory.uncategorized,
      categorySource:
        this.data.categorySource ?? TransactionCategorySource.fallback,
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
    learnedMatchOverride?: CategoryMatchRecord | null,
    defaultRulesOverride?: readonly CategoryDefaultRule[],
  ): Promise<TransactionWithCategoryPatch> {
    const space = input.spaceId
      ? await Space.findOwnedById(userAccountId, input.spaceId)
      : await Space.findOrCreateActive(userAccountId, input.spaceName);

    if (!space || space.toRecord().isArchived) {
      throw new Error("space_not_found");
    }
    if (
      input.categorySelection === "manual" &&
      (!input.category ||
        !Object.values(TransactionCategory).includes(input.category))
    ) {
      throw new Error("transaction_category_invalid");
    }
    const transaction = await prisma.$transaction(async (tx) => {
      const splitParticipantIds = await SpaceMember.serializeParticipants(
        tx,
        userAccountId,
        space.persistedId,
        input.participantIds,
      );
      const learnedMatch =
        learnedMatchOverride === undefined
          ? await CategoryMatch.findApplicable(
              tx,
              userAccountId,
              input.description,
              input.type,
            )
          : learnedMatchOverride;
      const defaults =
        defaultRulesOverride ?? (await CategoryDefault.listActive(tx));
      const resolution = resolveTransactionCategory(
        input.description,
        input.type,
        [],
        defaults,
      );
      const category =
        input.categorySelection === "manual"
          ? input.category!
          : (learnedMatch?.category ?? resolution.category);
      const categorySource =
        input.categorySelection === "manual"
          ? TransactionCategorySource.manual
          : learnedMatch
            ? TransactionCategorySource.learned
            : resolution.source === "rule"
              ? TransactionCategorySource.rule
              : TransactionCategorySource.fallback;
      const created = await tx.transaction.create({
        data: {
          splitParticipantIds,
          type: input.type,
          spaceId: space.persistedId,
          transferSpaceId: null,
          description: input.description,
          amount: input.amount,
          category,
          categorySource,
          beginDate: input.beginDate,
          endDate: input.endDate || null,
        },
        include: transactionWithSpaceInclude,
      });
      let categoryMatchPatch: CategoryMatchPatch | undefined;
      if (input.categorySelection === "manual") {
        const learned = await CategoryMatch.learnExplicitChoice(tx, {
          userAccountId,
          description: input.description,
          transactionType: input.type,
          category: input.category!,
        });
        if (learned.changed && learned.match) {
          categoryMatchPatch = {
            ownerId: userAccountId,
            rulesVersion: learned.rulesVersion,
            match: {
              normalizedDescription: learned.match.normalizedDescription,
              transactionType: learned.match.transactionType,
              category: learned.match.category,
            },
          };
        }
      }
      return { ...created, categoryMatchPatch };
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
  ): Promise<TransactionWithCategoryPatch[]> {
    const results: TransactionWithCategoryPatch[] = [];
    const learnedMatches = await CategoryMatch.findApplicableMany(
      userAccountId,
      inputs.map((input) => ({
        description: input.description,
        transactionType: input.type,
      })),
    );

    const defaults = await CategoryDefault.listActive();
    for (const input of inputs) {
      const learnedMatch = learnedMatches.get(
        CategoryMatch.getKey(input.description, input.type),
      );
      results.push(
        await Transaction.createForUser(
          userAccountId,
          input,
          learnedMatch ?? null,
          defaults,
        ),
      );
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
    spaceId?: string,
  ): Promise<TransactionWithSpaceRecord[]> {
    return prisma.transaction.findMany({
      where: {
        ...(spaceId ? { spaceId } : {}),
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

  public static async listRecurringTransactionsForUser(
    userAccountId: string,
    windowEnd: Date,
  ): Promise<TransactionWithSpaceRecord[]> {
    return prisma.transaction.findMany({
      where: {
        transferSpaceId: null,
        endDate: null,
        beginDate: {
          lte: windowEnd,
        },
        space: {
          userAccountId,
          isArchived: false,
          OR: [{ type: null }, { type: { not: "credit_card" } }],
        },
      },
      include: transactionWithSpaceInclude,
      orderBy: [{ beginDate: "asc" }, { createdAt: "asc" }],
    });
  }

  /** Expand complete schedules before applying the reporting month, including card cutoffs and month-end clamping. No participant join or preview limit is applied. */
  private static getMonthlyOccurrencesSql(
    userAccountId: string,
    monthEnd: Date,
    includeTransfers = false,
  ): Prisma.Sql {
    return Prisma.sql`
        SELECT
          e.id,
          e.type,
          e.amount,
          e.category,
          "getSpaceProjectionMonthStart"(
            a.type::text,
            a."paymentDueDay",
            a."periodEndDay",
            occurrence.occurrence_date::timestamp
          ) AS "projectedMonthStart"
        FROM "Transaction" e
        INNER JOIN "Space" a
          ON a.id = e."spaceId"
        CROSS JOIN LATERAL generate_series(
          date_trunc('month', e."beginDate"),
          date_trunc('month', COALESCE(e."endDate", ${monthEnd})),
          interval '1 month'
        ) AS occurrence_month(month_start)
        CROSS JOIN LATERAL (
          SELECT
            occurrence_month.month_start
            + make_interval(
                days => LEAST(
                  EXTRACT(DAY FROM e."beginDate")::integer,
                  EXTRACT(DAY FROM occurrence_month.month_start + interval '1 month - 1 day')::integer
                ) - 1
              ) AS occurrence_date
        ) occurrence
        WHERE a."userAccountId" = ${userAccountId}
          AND (${includeTransfers} OR e."transferSpaceId" IS NULL)
          AND e."beginDate" <= ${monthEnd}
    `;
  }

  /** Aggregate current category allocations for an owned reporting month. Transfers are excluded; income and expenses never cancel each other in the donut. */
  public static async getMonthCategoryAllocationsForUser(
    userAccountId: string,
    monthStartInput: Date,
  ): Promise<CategoryAllocationSummary> {
    const monthStart = startOfMonth(monthStartInput);
    const monthEnd = endOfMonth(monthStart);
    const rows = await prisma.$queryRaw<
      Array<{
        category: TransactionCategory;
        incomeCents: Prisma.Decimal;
        expenseCents: Prisma.Decimal;
        incomeCount: bigint;
        expenseCount: bigint;
      }>
    >`
      WITH transaction_occurrences AS (
        ${Transaction.getMonthlyOccurrencesSql(userAccountId, monthEnd)}
      )
      SELECT e.category,
        COALESCE(SUM(ROUND(ABS(e.amount)::numeric * 100)) FILTER (WHERE e.type = 'income'), 0) AS "incomeCents",
        COALESCE(SUM(ROUND(ABS(e.amount)::numeric * 100)) FILTER (WHERE e.type = 'expense'), 0) AS "expenseCents",
        COUNT(*) FILTER (WHERE e.type = 'income') AS "incomeCount",
        COUNT(*) FILTER (WHERE e.type = 'expense') AS "expenseCount"
      FROM transaction_occurrences e
      WHERE e."projectedMonthStart" = ${monthStart}
        AND e.type IN ('income', 'expense')
      GROUP BY e.category
      ORDER BY e.category
    `;
    let totalIncomeCents = 0;
    let totalExpenseCents = 0;
    const categories: CategoryAllocation[] = rows.map((row) => {
      const incomeCents = Number(row.incomeCents);
      const expenseCents = Number(row.expenseCents);
      const incomeCount = Number(row.incomeCount);
      const expenseCount = Number(row.expenseCount);
      totalIncomeCents += incomeCents;
      totalExpenseCents += expenseCents;
      return {
        category: row.category,
        amount: (incomeCents + expenseCents) / 100,
        income: incomeCents / 100,
        expense: expenseCents / 100,
        transactionCount: incomeCount + expenseCount,
        type:
          incomeCount && expenseCount
            ? "mixed"
            : incomeCount
              ? "income"
              : "expense",
      };
    });
    categories.sort(
      (left, right) =>
        right.amount - left.amount ||
        left.category.localeCompare(right.category),
    );
    return {
      categories,
      income: totalIncomeCents / 100,
      expense: totalExpenseCents / 100,
      total: (totalIncomeCents + totalExpenseCents) / 100,
      transactionCount: categories.reduce(
        (sum, category) => sum + category.transactionCount,
        0,
      ),
    };
  }

  public static async getMonthTotalsForUser(
    userAccountId: string,
    monthStartInput: Date,
  ): Promise<DashboardTotals> {
    const monthStart = startOfMonth(monthStartInput);
    const monthEnd = endOfMonth(monthStart);

    const rows = await prisma.$queryRaw<MonthTotalsRow[]>`
      WITH transaction_occurrences AS (
        ${Transaction.getMonthlyOccurrencesSql(userAccountId, monthEnd)}
      )
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
        FROM transaction_occurrences e
        WHERE e."projectedMonthStart" = ${monthStart}
      ) AS totals
    `;

    const totals = rows[0];

    return {
      income: Number(totals?.income || 0),
      expense: Number(totals?.expense || 0),
      net: Number(totals?.net || 0),
    };
  }

  private static getProjectionMonthContext(focusedMonthStart: Date): {
    normalizedFocusedMonthStart: Date;
    endMonthStart: Date;
    focusedMonthEnd: Date;
    focusedMonthIsCurrent: boolean;
  } {
    const normalizedFocusedMonthStart = startOfMonth(focusedMonthStart);

    return {
      normalizedFocusedMonthStart,
      endMonthStart: addMonths(normalizedFocusedMonthStart, 5),
      focusedMonthEnd: endOfMonth(normalizedFocusedMonthStart),
      focusedMonthIsCurrent: isSameMonth(
        normalizedFocusedMonthStart,
        startOfMonth(new Date()),
      ),
    };
  }

  public static async getProjectionHeaderQueryData(
    userAccountId: string,
    focusedMonthStart: Date,
  ): Promise<ProjectionHeaderQueryData> {
    const { normalizedFocusedMonthStart } =
      Transaction.getProjectionMonthContext(focusedMonthStart);

    return {
      normalizedFocusedMonthStart,
      focusedMonthTotals: await Transaction.getMonthTotalsForUser(
        userAccountId,
        normalizedFocusedMonthStart,
      ),
    };
  }

  public static async getProjectionChartQueryData(
    userAccountId: string,
    focusedMonthStart: Date,
  ): Promise<ProjectionChartQueryData> {
    const { normalizedFocusedMonthStart, endMonthStart } =
      Transaction.getProjectionMonthContext(focusedMonthStart);

    return {
      normalizedFocusedMonthStart,
      chartRows: await prisma.$queryRaw<ProjectionChartMonthRow[]>`
        WITH months AS (
          SELECT generate_series(
            ${normalizedFocusedMonthStart}::timestamp,
            ${endMonthStart}::timestamp,
            interval '1 month'
          ) AS month_start
        ),
        transaction_occurrences AS (
          SELECT
            e.type,
            e.amount,
            "getSpaceProjectionMonthStart"(
              a.type::text,
              a."paymentDueDay",
              a."periodEndDay",
              occurrence.occurrence_date::timestamp
            ) AS "projectedMonthStart"
          FROM "Transaction" e
          INNER JOIN "Space" a
            ON a.id = e."spaceId"
          CROSS JOIN LATERAL generate_series(
            date_trunc('month', e."beginDate"),
            date_trunc('month', COALESCE(e."endDate", ${endMonthStart})),
            interval '1 month'
          ) AS occurrence_month(month_start)
          CROSS JOIN LATERAL (
            SELECT
              occurrence_month.month_start
              + make_interval(
                  days => LEAST(
                    EXTRACT(DAY FROM e."beginDate")::integer,
                    EXTRACT(DAY FROM occurrence_month.month_start + interval '1 month - 1 day')::integer
                  ) - 1
                ) AS occurrence_date
          ) occurrence
          WHERE a."userAccountId" = ${userAccountId}
            AND e."transferSpaceId" IS NULL
            AND e."beginDate" <= (${endMonthStart}::timestamp + interval '1 month - 1 millisecond')
        )
        SELECT
          to_char(months.month_start, 'YYYY-MM') AS "monthKey",
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
        FROM months
        LEFT JOIN transaction_occurrences e
          ON e."projectedMonthStart" = months.month_start
        GROUP BY months.month_start
        ORDER BY months.month_start ASC
      `,
    };
  }

  public static async getProjectionSpacesQueryData(
    userAccountId: string,
    focusedMonthStart: Date,
  ): Promise<ProjectionSpacesQueryData> {
    const { normalizedFocusedMonthStart, focusedMonthEnd } =
      Transaction.getProjectionMonthContext(focusedMonthStart);

    const [spaceSummaryRows, spaceTransactionsRows] = await Promise.all([
      prisma.$queryRaw<ProjectionFocusedSpaceSummaryRow[]>`
        WITH transaction_occurrences AS (
          SELECT
            a.id AS "spaceId",
            a.name AS "spaceName",
            e.id,
            e.type,
            e.amount,
            "getSpaceProjectionMonthStart"(
              a.type::text,
              a."paymentDueDay",
              a."periodEndDay",
              occurrence.occurrence_date::timestamp
            ) AS "projectedMonthStart"
          FROM "Space" a
          INNER JOIN "Transaction" e
            ON e."spaceId" = a.id
          CROSS JOIN LATERAL generate_series(
            date_trunc('month', e."beginDate"),
            date_trunc('month', COALESCE(e."endDate", ${focusedMonthEnd})),
            interval '1 month'
          ) AS occurrence_month(month_start)
          CROSS JOIN LATERAL (
            SELECT
              occurrence_month.month_start
              + make_interval(
                  days => LEAST(
                    EXTRACT(DAY FROM e."beginDate")::integer,
                    EXTRACT(DAY FROM occurrence_month.month_start + interval '1 month - 1 day')::integer
                  ) - 1
                ) AS occurrence_date
          ) occurrence
          WHERE a."userAccountId" = ${userAccountId}
            AND e."beginDate" <= ${focusedMonthEnd}
        )
        SELECT
          transaction_occurrences."spaceId",
          transaction_occurrences."spaceName",
          COALESCE(
            SUM(
              CASE
                WHEN transaction_occurrences.type = 'expense' THEN
                  CASE
                    WHEN transaction_occurrences.amount > 0 THEN -transaction_occurrences.amount
                    ELSE transaction_occurrences.amount
                  END
                ELSE transaction_occurrences.amount
              END
            ),
            0
          ) AS "monthTotal",
          COUNT(transaction_occurrences.id)::integer AS "monthTransactionCount"
        FROM transaction_occurrences
        WHERE transaction_occurrences."projectedMonthStart" = ${normalizedFocusedMonthStart}
        GROUP BY transaction_occurrences."spaceId", transaction_occurrences."spaceName"
        ORDER BY transaction_occurrences."spaceName" ASC
      `,
      prisma.$queryRaw<ProjectionFocusedSpaceTransactionRow[]>`
        WITH transaction_occurrences AS (
          SELECT
            a.id AS "spaceId",
            a.name AS "spaceName",
            e.id,
            e.type,
            e."transferSpaceId",
            transfer_space.name AS "transferSpaceName",
            e.description,
            e."splitParticipantIds",
            e.amount,
            e."beginDate",
            e."endDate",
            e."createdAt",
            e."updatedAt",
            occurrence.occurrence_date::timestamp,
            "getSpaceProjectionMonthStart"(
              a.type::text,
              a."paymentDueDay",
              a."periodEndDay",
              occurrence.occurrence_date::timestamp
            ) AS "projectedMonthStart"
          FROM "Space" a
          INNER JOIN "Transaction" e
            ON e."spaceId" = a.id
          LEFT JOIN "Space" transfer_space
            ON transfer_space.id = e."transferSpaceId"
          CROSS JOIN LATERAL generate_series(
            date_trunc('month', e."beginDate"),
            date_trunc('month', COALESCE(e."endDate", ${focusedMonthEnd})),
            interval '1 month'
          ) AS occurrence_month(month_start)
          CROSS JOIN LATERAL (
            SELECT
              occurrence_month.month_start
              + make_interval(
                  days => LEAST(
                    EXTRACT(DAY FROM e."beginDate")::integer,
                    EXTRACT(DAY FROM occurrence_month.month_start + interval '1 month - 1 day')::integer
                  ) - 1
                ) AS occurrence_date
          ) occurrence
          WHERE a."userAccountId" = ${userAccountId}
            AND e."beginDate" <= ${focusedMonthEnd}
        )
        SELECT
          ranked."spaceId",
          ranked."spaceName",
          ranked.id,
          ranked.type,
          ranked."transferSpaceId",
          ranked."transferSpaceName",
          ranked.description,
          ranked."splitParticipantIds",
          ranked.amount,
          ranked."beginDate",
          ranked."endDate",
          ranked."createdAt",
            ranked."updatedAt"
        FROM (
          SELECT
            transaction_occurrences."spaceId",
            transaction_occurrences."spaceName",
            transaction_occurrences.id,
            transaction_occurrences.type,
            transaction_occurrences."transferSpaceId",
            transaction_occurrences."transferSpaceName",
            transaction_occurrences.description,
            transaction_occurrences."splitParticipantIds",
            transaction_occurrences.amount,
            transaction_occurrences."beginDate",
            transaction_occurrences."endDate",
            transaction_occurrences."createdAt",
            transaction_occurrences."updatedAt",
            ROW_NUMBER() OVER (
              PARTITION BY transaction_occurrences."spaceId"
              ORDER BY transaction_occurrences.occurrence_date DESC, transaction_occurrences."createdAt" DESC
            ) AS row_number
          FROM transaction_occurrences
          WHERE transaction_occurrences."projectedMonthStart" = ${normalizedFocusedMonthStart}
        ) ranked
        WHERE ranked.row_number <= 5
        ORDER BY ranked."spaceName" ASC, ranked."beginDate" DESC, ranked."createdAt" DESC
      `,
    ]);

    return {
      normalizedFocusedMonthStart,
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
    const today = startOfDay(now);
    const upcomingEnd = endOfDay(addDays(today, 14));
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(currentMonthStart);
    const nextMonthStart = startOfMonth(addMonths(currentMonthStart, 1));
    const nextMonthEnd = endOfMonth(nextMonthStart);
    const [creditCardSpaces, recurringTransactions] = await Promise.all([
      Space.listActiveCreditCardSpaces(userAccountId),
      Transaction.listRecurringTransactionsForUser(userAccountId, upcomingEnd),
    ]);
    const settlementPayments = await Promise.all(
      creditCardSpaces.flatMap((space) => [
        Transaction.getUpcomingCreditCardSettlement(
          space,
          currentMonthStart,
          currentMonthEnd,
          today,
          upcomingEnd,
        ),
        Transaction.getUpcomingCreditCardSettlement(
          space,
          nextMonthStart,
          nextMonthEnd,
          today,
          upcomingEnd,
        ),
      ]),
    );
    const recurringPayments = recurringTransactions.flatMap((transaction) => {
      const currentMonthPayment = Transaction.getUpcomingRecurringTransaction(
        transaction,
        currentMonthStart,
        currentMonthEnd,
        today,
        upcomingEnd,
      );
      const nextMonthPayment = Transaction.getUpcomingRecurringTransaction(
        transaction,
        nextMonthStart,
        nextMonthEnd,
        today,
        upcomingEnd,
      );

      return [currentMonthPayment, nextMonthPayment].filter(
        (payment): payment is DashboardUpcomingTransactionRecord =>
          payment !== null,
      );
    });
    const upcomingPayments = [...settlementPayments, ...recurringPayments]
      .filter(
        (payment): payment is DashboardUpcomingPaymentRecord =>
          payment !== null,
      )
      .sort((left, right) => {
        if (left.dueDate.getTime() === right.dueDate.getTime()) {
          if (left.kind !== right.kind) {
            return left.kind.localeCompare(right.kind);
          }

          return left.description.localeCompare(right.description);
        }

        return left.dueDate.getTime() - right.dueDate.getTime();
      })
      .slice(0, 6);

    return {
      upcomingPayments,
      monthStart: today,
      monthEnd: upcomingEnd,
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

  /** List owned stored rows with composable category, reporting-month, type, search, and original-date filters. Reporting months resolve complete occurrences before pagination; each stored row appears once. */
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

    if (filters.category) {
      where.category = filters.category;
      if (filters.type !== "transfer") where.transferSpaceId = null;
    }

    if (filters.reportingMonth) {
      const reportingMonth = startOfMonth(filters.reportingMonth);
      // Select stored IDs from complete occurrences, not original begin dates or a preview.
      // The list can include transfers; chart links explicitly select income or expense.
      const matching = await prisma.$queryRaw<Array<{ id: string }>>`
        WITH transaction_occurrences AS (
          ${Transaction.getMonthlyOccurrencesSql(userAccountId, endOfMonth(reportingMonth), true)}
        )
        SELECT DISTINCT e.id FROM transaction_occurrences e
        WHERE e."projectedMonthStart" = ${reportingMonth}
      `;
      where.id = { in: matching.map((row) => row.id) };
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

  public static async listForMassEdit(userAccountId: string, ids: string[]) {
    if (!ids.length || ids.length > 500 || new Set(ids).size !== ids.length)
      throw new Error("mass_edit.invalid_selection");
    const records = await prisma.transaction.findMany({
      where: { id: { in: ids }, space: { userAccountId, isArchived: false } },
    });
    if (records.length !== ids.length)
      throw new Error("mass_edit.invalid_selection");
    const byId = new Map(records.map((record) => [record.id, record]));
    return ids.map((id) =>
      serializeMassEditTransaction(byId.get(id)!, userAccountId),
    );
  }

  public static async massUpdateForUser(
    userAccountId: string,
    input: MassTransactionUpdate,
  ): Promise<string[]> {
    if (
      !input ||
      !Array.isArray(input.transactions) ||
      !input.transactions.length ||
      input.transactions.length > 500 ||
      (input.type !== undefined &&
        input.type !== "income" &&
        input.type !== "expense") ||
      (input.spaceId !== undefined &&
        (typeof input.spaceId !== "string" || !input.spaceId))
    )
      throw new Error("mass_edit.invalid_fields");
    const ids = input.transactions.map((row) => row?.id);
    if (
      ids.some((id) => typeof id !== "string" || !id) ||
      new Set(ids).size !== ids.length
    )
      throw new Error("mass_edit.invalid_selection");
    for (const row of input.transactions) {
      if (
        typeof row.description !== "string" ||
        !row.description.trim() ||
        !Number.isFinite(row.amount) ||
        row.amount <= 0 ||
        typeof row.beginDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(row.beginDate) ||
        Number.isNaN(new Date(row.beginDate).getTime()) ||
        new Date(row.beginDate).toISOString().slice(0, 10) !== row.beginDate ||
        typeof row.updatedAt !== "string"
      )
        throw new Error("mass_edit.invalid_fields");
    }
    const affectedSpaces = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT t.id FROM "Transaction" t INNER JOIN "Space" s ON s.id = t."spaceId"
        WHERE t.id IN (${Prisma.join(ids)}) AND s."userAccountId" = ${userAccountId}
        FOR UPDATE OF t
      `;
      if (locked.length !== ids.length)
        throw new Error("mass_edit.invalid_selection");
      const records = await tx.transaction.findMany({
        where: { id: { in: ids }, space: { userAccountId, isArchived: false } },
      });
      if (records.length !== ids.length)
        throw new Error("mass_edit.invalid_selection");
      const reason = getMassEditBlockReason(
        records.map((record) =>
          serializeMassEditTransaction(record, userAccountId),
        ),
      );
      if (reason) throw new Error(reason);
      const byId = new Map(records.map((record) => [record.id, record]));
      const changedSpaces = new Set<string>();
      for (const row of input.transactions) {
        const previous = byId.get(row.id)!;
        if (previous.updatedAt.toISOString() !== row.updatedAt)
          throw new Error("mass_edit.stale");
        const spaceId = input.spaceId || previous.spaceId;
        const participants = parseSplitParticipants(
          previous.splitParticipantIds,
        );
        if (
          spaceId !== previous.spaceId &&
          participants.some((id) => id !== userAccountId)
        )
          throw new Error("mass_edit.shared_space");
        const splitParticipantIds = await SpaceMember.serializeParticipants(
          tx,
          userAccountId,
          spaceId,
          participants.length ? participants : [userAccountId],
          spaceId === previous.spaceId ? previous.splitParticipantIds : null,
        );
        const beginDate = new Date(`${row.beginDate}T00:00:00.000Z`);
        const schedule = deriveScheduleFromDates({
          beginDate: previous.beginDate,
          endDate: previous.endDate,
        });
        const type = input.type || previous.type;
        await tx.transaction.update({
          where: { id: row.id },
          data: {
            type,
            spaceId,
            splitParticipantIds,
            description: row.description.trim(),
            amount: normalizeTransactionAmount(type, row.amount),
            beginDate,
            endDate: resolveEndDate({ ...schedule, beginDate }),
          },
        });
        changedSpaces.add(previous.spaceId);
        changedSpaces.add(spaceId);
      }
      return [...changedSpaces];
    });
    await Space.syncCurrentMonthTransactionCounts(affectedSpaces);
    return affectedSpaces;
  }

  public static async updateForUser(
    userAccountId: string,
    id: string,
    input: Partial<CreateTransactionInput>,
  ): Promise<TransactionWithCategoryPatch> {
    const existingTransaction = await Transaction.findOwnedById(
      userAccountId,
      id,
    );

    if (!existingTransaction) {
      throw new Error("failed_to_update_transaction");
    }

    let spaceId = existingTransaction.data.spaceId;
    if (input.spaceId || input.spaceName) {
      const space = input.spaceId
        ? await Space.findOwnedById(userAccountId, input.spaceId)
        : await Space.findOrCreateActive(userAccountId, input.spaceName!);
      if (!space || space.toRecord().isArchived)
        throw new Error("space_not_found");
      spaceId = space.persistedId;
    }
    const previous =
      spaceId === existingTransaction.data.spaceId
        ? (existingTransaction.data.splitParticipantIds ?? null)
        : null;
    const selected =
      input.participantIds ??
      (spaceId === existingTransaction.data.spaceId && previous
        ? parseSplitParticipants(previous)
        : undefined);
    const updatedTransaction = await prisma.$transaction(async (tx) => {
      const splitParticipantIds = existingTransaction.data.transferSpaceId
        ? null
        : await SpaceMember.serializeParticipants(
            tx,
            userAccountId,
            spaceId,
            selected,
            previous,
          );
      const explicitCategory =
        input.categorySelection === "manual" &&
        !existingTransaction.data.transferSpaceId;
      if (
        explicitCategory &&
        (!input.category ||
          !Object.values(TransactionCategory).includes(input.category))
      ) {
        throw new Error("transaction_category_invalid");
      }
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          splitParticipantIds,
          ...(input.type && { type: input.type }),
          spaceId,
          ...(input.description && { description: input.description }),
          ...(input.amount !== undefined && { amount: input.amount }),
          ...(input.beginDate && { beginDate: input.beginDate }),
          ...(input.endDate !== undefined && { endDate: input.endDate }),
          ...(explicitCategory && {
            category: input.category!,
            categorySource: TransactionCategorySource.manual,
          }),
        },
        include: transactionWithSpaceInclude,
      });
      let categoryMatchPatch: CategoryMatchPatch | undefined;
      if (explicitCategory) {
        const learned = await CategoryMatch.learnExplicitChoice(tx, {
          userAccountId,
          description:
            input.description ?? existingTransaction.data.description,
          transactionType:
            input.type ??
            (existingTransaction.data.type as "income" | "expense"),
          category: input.category!,
        });
        if (learned.changed && learned.match) {
          categoryMatchPatch = {
            ownerId: userAccountId,
            rulesVersion: learned.rulesVersion,
            match: {
              normalizedDescription: learned.match.normalizedDescription,
              transactionType: learned.match.transactionType,
              category: learned.match.category,
            },
          };
        }
      }
      return { ...updated, categoryMatchPatch };
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

  private static async getUpcomingCreditCardSettlement(
    space: CreditCardSpaceRecord,
    monthStart: Date,
    monthEnd: Date,
    windowStart: Date,
    windowEnd: Date,
  ): Promise<DashboardUpcomingPaymentRecord | null> {
    const dueDate = Transaction.getCreditCardDueDateForMonth(
      monthStart,
      monthEnd,
      space.paymentDueDay,
    );

    if (dueDate < windowStart || dueDate > windowEnd) {
      return null;
    }

    // Statements are reported in the month after they are debited.
    // Legacy cards retain their saved settlement timing.
    const isLegacyCard = space.periodEndDay === null;
    const projectedMonthStart =
      !isLegacyCard ||
      space.paymentTiming === CreditCardPaymentTiming.previous_month
        ? startOfMonth(addMonths(monthStart, 1))
        : startOfMonth(dueDate);
    const projectedMonthEnd = endOfMonth(projectedMonthStart);

    const rows = isLegacyCard
      ? await prisma.$queryRaw<Array<{ total: number | null }>>`
          SELECT COALESCE(SUM(ABS(t.amount)), 0) AS total
          FROM "Transaction" t
          WHERE t."spaceId" = ${space.id}
            AND t.type = 'expense'
            AND t."transferSpaceId" IS NULL
            AND t."beginDate" <= ${projectedMonthEnd}
            AND (t."endDate" IS NULL OR t."endDate" >= ${projectedMonthStart})
        `
      : await prisma.$queryRaw<Array<{ total: number | null }>>`
      WITH transaction_occurrences AS (
        SELECT
          CASE WHEN t.type = 'expense' THEN ABS(t.amount) ELSE -t.amount END AS amount,
          "getSpaceProjectionMonthStart"(
            'credit_card'::text,
            ${space.paymentDueDay}::integer,
            ${space.periodEndDay}::integer,
            occurrence.occurrence_date::timestamp
          ) AS "projectedMonthStart"
        FROM "Transaction" t
        CROSS JOIN LATERAL generate_series(
          date_trunc('month', t."beginDate"),
          date_trunc('month', COALESCE(t."endDate", ${projectedMonthEnd})),
          interval '1 month'
        ) AS occurrence_month(month_start)
        CROSS JOIN LATERAL (
          SELECT
            occurrence_month.month_start
            + make_interval(
                days => LEAST(
                  EXTRACT(DAY FROM t."beginDate")::integer,
                  EXTRACT(DAY FROM occurrence_month.month_start + interval '1 month - 1 day')::integer
                ) - 1
              ) AS occurrence_date
        ) occurrence
        WHERE t."spaceId" = ${space.id}
          AND t.type IN ('expense', 'income')
          AND t."transferSpaceId" IS NULL
          AND t."beginDate" <= ${projectedMonthEnd}
      )
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM transaction_occurrences
      WHERE "projectedMonthStart" = ${projectedMonthStart}
    `;
    const total = Number(rows[0]?.total || 0);

    if (total <= 0) {
      return null;
    }

    return {
      kind: "credit_card_settlement",
      id: `credit-card-settlement-${space.id}-${projectedMonthStart.toISOString()}`,
      spaceId: space.id,
      spaceName: space.name,
      description: space.name,
      amount: total,
      dueDate,
      projectedMonthStart,
      projectedMonthEnd,
    };
  }

  private static getUpcomingRecurringTransaction(
    transaction: TransactionWithSpaceRecord,
    monthStart: Date,
    monthEnd: Date,
    windowStart: Date,
    windowEnd: Date,
  ): DashboardUpcomingTransactionRecord | null {
    if (transaction.endDate !== null) {
      return null;
    }

    if (startOfMonth(monthStart) < startOfMonth(transaction.beginDate)) {
      return null;
    }

    const dueDate = new Date(monthStart);
    dueDate.setDate(
      Math.min(transaction.beginDate.getDate(), monthEnd.getDate()),
    );

    if (dueDate < windowStart || dueDate > windowEnd) {
      return null;
    }

    return {
      kind: "transaction",
      id: transaction.id,
      type: transaction.type as "income" | "expense",
      spaceId: transaction.spaceId,
      spaceName: transaction.space.name,
      description: transaction.description,
      amount: transaction.amount,
      dueDate,
    };
  }

  private static getCreditCardDueDateForMonth(
    monthStart: Date,
    monthEnd: Date,
    paymentDueDay: number | null,
  ): Date {
    const dueDate = new Date(monthStart);
    const safeDueDay = paymentDueDay ?? 1;

    dueDate.setDate(Math.min(safeDueDay, monthEnd.getDate()));

    return dueDate;
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
