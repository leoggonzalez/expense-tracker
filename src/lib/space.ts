import { CreditCardPaymentTiming, Prisma, SpaceType } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";

import { prisma } from "@/lib/prisma";

export type SpaceBaseData = {
  userAccountId: string;
  name: string;
  main: boolean | null;
  type: SpaceType | null;
  paymentDueDay: number | null;
  paymentTiming: CreditCardPaymentTiming | null;
  isArchived: boolean;
  currentMonthTransactionCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SpacePersistedData = SpaceBaseData & {
  id: string;
};

export type SpaceCreateData = Pick<SpaceBaseData, "userAccountId" | "name"> &
  Partial<Omit<SpaceBaseData, "userAccountId" | "name">>;

export type SpaceRecord = SpacePersistedData;

export type SpaceMonthSummaryRecord = {
  id: string;
  name: string;
  currentMonthTotal: number;
};

export type CreditCardSpaceRecord = {
  id: string;
  name: string;
  paymentDueDay: number;
  paymentTiming: CreditCardPaymentTiming;
};

type SpaceDetailMetrics = {
  id: string;
  name: string;
  main: boolean | null;
  type: SpaceType | null;
  paymentDueDay: number | null;
  paymentTiming: CreditCardPaymentTiming | null;
  isArchived: boolean;
  transactionCount: number;
  historicalTotal: number;
  selectedMonthTotal: number;
};

type SpaceMonthSummaryRow = {
  id: string;
  name: string;
  currentMonthTotal: number | null;
};

type SpaceDetailMetricsRow = {
  id: string;
  name: string;
  main: boolean | null;
  type: SpaceType | null;
  paymentDueDay: number | null;
  paymentTiming: CreditCardPaymentTiming | null;
  isArchived: boolean;
  transactionCount: number | null;
  historicalTotal: number | null;
  selectedMonthTotal: number | null;
};

const spaceTransactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  id: true,
  type: true,
  transferSpaceId: true,
  transferSpace: {
    select: {
      name: true,
    },
  },
  description: true,
  amount: true,
  beginDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
});

export type SpaceTransactionRecord = Prisma.TransactionGetPayload<{
  select: typeof spaceTransactionSelect;
}>;

type SpaceDetailPageQueryResult = {
  metrics: SpaceDetailMetrics;
  allTransactions: SpaceTransactionRecord[];
  selectedMonthRelevantTransactions: SpaceTransactionRecord[];
};

export class Space {
  public data: SpaceCreateData | SpacePersistedData;

  public constructor(data: SpaceCreateData | SpacePersistedData) {
    this.data = {
      main: null,
      type: null,
      paymentDueDay: null,
      paymentTiming: null,
      isArchived: false,
      currentMonthTransactionCount: 0,
      ...data,
    };
  }

  public async create(): Promise<Space> {
    const record = await prisma.space.create({
      data: {
        userAccountId: this.data.userAccountId,
        name: this.data.name,
        main: this.data.main,
        type: this.data.type,
        paymentDueDay: this.data.paymentDueDay,
        paymentTiming: this.data.paymentTiming,
      },
    });

    return Space.fromRecord(record);
  }

  public async updateDetails(input: {
    name: string;
    main: boolean | null;
    type: SpaceType | null;
    paymentDueDay: number | null;
    paymentTiming: CreditCardPaymentTiming | null;
  }): Promise<Space> {
    const record = await prisma.space.update({
      where: {
        id: this.persistedId,
      },
      data: {
        name: input.name,
        main: input.main,
        type: input.type,
        paymentDueDay: input.paymentDueDay,
        paymentTiming: input.paymentTiming,
      },
    });

    return Space.fromRecord(record);
  }

  public async archive(): Promise<Space> {
    const record = await prisma.space.update({
      where: {
        id: this.persistedId,
      },
      data: {
        isArchived: true,
        main: null,
      },
    });

    return Space.fromRecord(record);
  }

  public async unarchive(): Promise<Space> {
    const record = await prisma.space.update({
      where: {
        id: this.persistedId,
      },
      data: {
        isArchived: false,
      },
    });

    return Space.fromRecord(record);
  }

  public get persistedId(): string {
    return this.requirePersistedId();
  }

  public toRecord(): SpacePersistedData {
    if (!("id" in this.data) || !this.data.id) {
      throw new Error("space_id_required");
    }

    return {
      id: this.data.id,
      userAccountId: this.data.userAccountId,
      name: this.data.name,
      main: this.data.main,
      type: this.data.type,
      paymentDueDay: this.data.paymentDueDay,
      paymentTiming: this.data.paymentTiming,
      isArchived: this.data.isArchived,
      currentMonthTransactionCount: this.data.currentMonthTransactionCount,
      createdAt: this.requirePersistedDate(this.data.createdAt),
      updatedAt: this.requirePersistedDate(this.data.updatedAt),
    };
  }

  public static async findOwnedById(
    userAccountId: string,
    id: string,
  ): Promise<Space | null> {
    const record = await prisma.space.findFirst({
      where: {
        id,
        userAccountId,
      },
    });

    return record ? Space.fromRecord(record) : null;
  }

  public static async findActiveByName(
    userAccountId: string,
    name: string,
  ): Promise<Space | null> {
    const record = await prisma.space.findFirst({
      where: {
        userAccountId,
        name,
        isArchived: false,
      },
    });

    return record ? Space.fromRecord(record) : null;
  }

  public static async findMainByUser(
    userAccountId: string,
  ): Promise<Space | null> {
    const record = await prisma.space.findFirst({
      where: {
        userAccountId,
        isArchived: false,
        main: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return record ? Space.fromRecord(record) : null;
  }

  public static async findArchivedByName(
    userAccountId: string,
    name: string,
  ): Promise<Space | null> {
    const record = await prisma.space.findFirst({
      where: {
        userAccountId,
        name,
        isArchived: true,
      },
    });

    return record ? Space.fromRecord(record) : null;
  }

  public static async findOrCreateActive(
    userAccountId: string,
    name: string,
  ): Promise<Space> {
    const activeSpace = await Space.findActiveByName(userAccountId, name);

    if (activeSpace) {
      return activeSpace;
    }

    const archivedSpace = await Space.findArchivedByName(userAccountId, name);

    if (archivedSpace) {
      throw new Error("space_is_archived");
    }

    return new Space({
      userAccountId,
      name,
    }).create();
  }

  public static async listActiveByUser(
    userAccountId: string,
  ): Promise<Space[]> {
    const records = await prisma.space.findMany({
      where: {
        userAccountId,
        isArchived: false,
      },
      orderBy: {
        name: "asc",
      },
    });

    return records.map((record) => Space.fromRecord(record));
  }

  public static async listActiveCreditCardSpaces(
    userAccountId: string,
  ): Promise<CreditCardSpaceRecord[]> {
    const records = await prisma.space.findMany({
      where: {
        userAccountId,
        isArchived: false,
        type: SpaceType.credit_card,
        paymentDueDay: {
          not: null,
        },
        paymentTiming: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        paymentDueDay: true,
        paymentTiming: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return records.flatMap((record) =>
      record.paymentDueDay === null || record.paymentTiming === null
        ? []
        : [
            {
              id: record.id,
              name: record.name,
              paymentDueDay: record.paymentDueDay,
              paymentTiming: record.paymentTiming,
            },
          ],
    );
  }

  public static async listByArchiveStateWithMonthTotals(
    userAccountId: string,
    isArchived: boolean,
    monthStart: Date,
    monthEnd: Date,
  ): Promise<SpaceMonthSummaryRecord[]> {
    const rows = await prisma.$queryRaw<SpaceMonthSummaryRow[]>`
      SELECT
        s.id,
        s.name,
        COALESCE(
          SUM(
            CASE
              WHEN t.type = 'expense' THEN
                CASE
                  WHEN t.amount > 0 THEN -t.amount
                  ELSE t.amount
                END
              ELSE t.amount
            END
          ),
          0
        ) AS "currentMonthTotal"
      FROM "Space" s
      LEFT JOIN "Transaction" t
        ON t."spaceId" = s.id
       AND t."beginDate" <= ${monthEnd}
       AND (t."endDate" IS NULL OR t."endDate" >= ${monthStart})
      WHERE s."userAccountId" = ${userAccountId}
        AND s."isArchived" = ${isArchived}
      GROUP BY s.id, s.name
      ORDER BY s.name ASC
    `;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      currentMonthTotal: Number(row.currentMonthTotal || 0),
    }));
  }

  public static async getDetailPageQueryResult(
    userAccountId: string,
    spaceId: string,
    monthStart: Date,
    monthEnd: Date,
    take: number,
  ): Promise<SpaceDetailPageQueryResult | null> {
    const [metrics, allTransactions, selectedMonthRelevantTransactions] =
      await Promise.all([
        Space.getDetailMetrics(userAccountId, spaceId, monthStart, monthEnd),
        Space.listTransactionsForSpace(spaceId, take),
        Space.listRelevantTransactionsForMonth(spaceId, monthStart, monthEnd),
      ]);

    if (!metrics) {
      return null;
    }

    return {
      metrics,
      allTransactions,
      selectedMonthRelevantTransactions,
    };
  }

  public static async countTransactionsForSpace(
    spaceId: string,
  ): Promise<number> {
    return prisma.transaction.count({
      where: {
        spaceId,
      },
    });
  }

  public static async listTransactionsForSpace(
    spaceId: string,
    take?: number,
  ): Promise<SpaceTransactionRecord[]> {
    return prisma.transaction.findMany({
      where: {
        spaceId,
      },
      select: spaceTransactionSelect,
      orderBy: [{ beginDate: "desc" }, { createdAt: "desc" }],
      ...(take ? { take } : {}),
    });
  }

  public static async listRelevantTransactionsForMonth(
    spaceId: string,
    monthStart: Date,
    monthEnd: Date,
  ): Promise<SpaceTransactionRecord[]> {
    return prisma.transaction.findMany({
      where: {
        spaceId,
        beginDate: {
          lte: monthEnd,
        },
        OR: [
          {
            endDate: null,
          },
          {
            endDate: {
              gte: monthStart,
            },
          },
        ],
      },
      select: spaceTransactionSelect,
      orderBy: [{ beginDate: "desc" }, { createdAt: "desc" }],
    });
  }

  public static async syncCurrentMonthTransactionCount(
    spaceId: string,
  ): Promise<void> {
    const { monthStart, monthEnd } = Space.getCurrentMonthBounds();

    await prisma.$executeRaw`
      UPDATE "Space" s
      SET "currentMonthTransactionCount" = (
        SELECT COUNT(t.id)::integer
        FROM "Transaction" t
        WHERE t."spaceId" = s.id
          AND t."beginDate" <= ${monthEnd}
          AND (t."endDate" IS NULL OR t."endDate" >= ${monthStart})
      )
      WHERE s.id = ${spaceId}
    `;
  }

  public static async syncCurrentMonthTransactionCounts(
    spaceIds: string[],
  ): Promise<void> {
    const uniqueSpaceIds = Array.from(new Set(spaceIds.filter(Boolean)));

    if (uniqueSpaceIds.length === 0) {
      return;
    }

    await Promise.all(
      uniqueSpaceIds.map((spaceId) =>
        Space.syncCurrentMonthTransactionCount(spaceId),
      ),
    );
  }

  public static async syncAllCurrentMonthTransactionCounts(): Promise<void> {
    const { monthStart, monthEnd } = Space.getCurrentMonthBounds();

    await prisma.$executeRaw`
      UPDATE "Space" s
      SET "currentMonthTransactionCount" = COALESCE(month_counts."transactionCount", 0)
      FROM (
        SELECT
          s2.id AS "spaceId",
          COUNT(t.id)::integer AS "transactionCount"
        FROM "Space" s2
        LEFT JOIN "Transaction" t
          ON t."spaceId" = s2.id
         AND t."beginDate" <= ${monthEnd}
         AND (t."endDate" IS NULL OR t."endDate" >= ${monthStart})
        GROUP BY s2.id
      ) month_counts
      WHERE s.id = month_counts."spaceId"
    `;
  }

  private static async getDetailMetrics(
    userAccountId: string,
    spaceId: string,
    monthStart: Date,
    monthEnd: Date,
  ): Promise<SpaceDetailMetrics | null> {
    const rows = await prisma.$queryRaw<SpaceDetailMetricsRow[]>`
      SELECT
        s.id,
        s.name,
        s.main,
        s.type,
        s."paymentDueDay",
        s."paymentTiming",
        s."isArchived",
        (
          SELECT COUNT(*)::integer
          FROM "Transaction" t_all
          WHERE t_all."spaceId" = s.id
        ) AS "transactionCount",
        (
          SELECT
            COALESCE(
              SUM(
                CASE
                  WHEN t_history.type = 'expense' THEN
                    CASE
                      WHEN t_history.amount > 0 THEN -t_history.amount
                      ELSE t_history.amount
                    END
                  ELSE t_history.amount
                END
              ),
              0
            )
          FROM "Transaction" t_history
          WHERE t_history."spaceId" = s.id
        ) AS "historicalTotal",
        (
          SELECT
            COALESCE(
              SUM(
                CASE
                  WHEN t_month.type = 'expense' THEN
                    CASE
                      WHEN t_month.amount > 0 THEN -t_month.amount
                      ELSE t_month.amount
                    END
                  ELSE t_month.amount
                END
              ),
              0
            )
          FROM "Transaction" t_month
          WHERE t_month."spaceId" = s.id
            AND t_month."beginDate" <= ${monthEnd}
            AND (t_month."endDate" IS NULL OR t_month."endDate" >= ${monthStart})
        ) AS "selectedMonthTotal"
      FROM "Space" s
      WHERE s.id = ${spaceId}
        AND s."userAccountId" = ${userAccountId}
      LIMIT 1
    `;

    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      main: row.main,
      type: row.type,
      paymentDueDay: row.paymentDueDay,
      paymentTiming: row.paymentTiming,
      isArchived: row.isArchived,
      transactionCount: Number(row.transactionCount || 0),
      historicalTotal: Number(row.historicalTotal || 0),
      selectedMonthTotal: Number(row.selectedMonthTotal || 0),
    };
  }

  private static fromRecord(record: SpacePersistedData): Space {
    return new Space(record);
  }

  public static async setMainStatusForUser(
    userAccountId: string,
    spaceId: string,
    main: boolean | null,
  ): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      if (main) {
        await transaction.space.updateMany({
          where: {
            userAccountId,
            id: {
              not: spaceId,
            },
          },
          data: {
            main: null,
          },
        });
      }

      await transaction.space.update({
        where: {
          id: spaceId,
        },
        data: {
          main,
        },
      });
    });
  }

  private static getCurrentMonthBounds(): { monthStart: Date; monthEnd: Date } {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(monthStart);

    return { monthStart, monthEnd };
  }

  private requirePersistedDate(value: Date | undefined): Date {
    if (!value) {
      throw new Error("space_date_required");
    }

    return value;
  }

  private requirePersistedId(): string {
    if (!("id" in this.data) || !this.data.id) {
      throw new Error("space_id_required");
    }

    return this.data.id;
  }
}
