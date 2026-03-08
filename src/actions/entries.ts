"use server";

import { endOfDay, endOfMonth, format, startOfDay, startOfMonth } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface CreateEntryInput {
  type: "income" | "expense";
  accountName: string;
  description: string;
  amount: number;
  beginDate: Date;
  endDate?: Date | null;
}

type AccountRecord = {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type EntryWithAccountRecord = {
  id: string;
  type: string;
  accountId: string;
  description: string;
  amount: number;
  beginDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  account: AccountRecord;
};

export type SerializedProjectionEntry = {
  id: string;
  type: string;
  account: string;
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
  recentEntries: Array<{
    id: string;
    type: string;
    accountName: string;
    description: string;
    amount: number;
    beginDate: string;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  currentMonthRange: {
    startDate: string;
    endDate: string;
  };
};

type EntryFiltersWhere = {
  account: {
    userId: string;
  };
  accountId?: string;
  type?: "income" | "expense";
  description?: {
    contains: string;
    mode: "insensitive";
  };
  beginDate?: {
    gte?: Date;
    lte?: Date;
  };
};

type EntryListWithPagination = {
  entries: EntryWithAccountRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type EntryMutationResult =
  | {
      success: true;
      entry: EntryWithAccountRecord;
    }
  | {
      success: false;
      error: string;
    };

type MultipleEntryMutationResult =
  | {
      success: true;
      entries: EntryWithAccountRecord[];
    }
  | {
      success: false;
      error: string;
    };

async function findOrCreateAccount(userId: string, accountName: string) {
  let account = await prisma.account.findFirst({
    where: {
      userId,
      name: accountName,
    },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId,
        name: accountName,
      },
    });
  }

  return account;
}

function serializeProjectionEntry(
  entry: EntryWithAccountRecord,
): SerializedProjectionEntry {
  return {
    id: entry.id,
    type: entry.type,
    account: entry.account.name,
    description: entry.description,
    amount: entry.amount,
    beginDate: entry.beginDate.toISOString(),
    endDate: entry.endDate?.toISOString() || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function serializeDashboardRecentEntry(entry: EntryWithAccountRecord) {
  return {
    id: entry.id,
    type: entry.type,
    accountName: entry.account.name,
    description: entry.description,
    amount: entry.amount,
    beginDate: entry.beginDate.toISOString(),
    endDate: entry.endDate?.toISOString() || null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function revalidateEntryPages() {
  revalidatePath("/");
  revalidatePath("/projection");
  revalidatePath("/entries");
  revalidatePath("/entries/all");
  revalidatePath("/account");
  revalidatePath("/settings");
}

export async function createEntry(
  input: CreateEntryInput,
): Promise<EntryMutationResult> {
  const currentUser = await requireCurrentUser();

  try {
    const account = await findOrCreateAccount(
      currentUser.id,
      input.accountName,
    );

    const entry = await prisma.entry.create({
      data: {
        type: input.type,
        accountId: account.id,
        description: input.description,
        amount: input.amount,
        beginDate: input.beginDate,
        endDate: input.endDate || null,
      },
      include: {
        account: true,
      },
    });

    revalidateEntryPages();

    return { success: true, entry };
  } catch (error) {
    console.error("Error creating entry:", error);
    return { success: false, error: "failed_to_create_entry" };
  }
}

export async function createMultipleEntries(
  inputs: CreateEntryInput[],
): Promise<MultipleEntryMutationResult> {
  try {
    const results: EntryWithAccountRecord[] = [];

    for (const input of inputs) {
      const result = await createEntry(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      results.push(result.entry);
    }

    return { success: true, entries: results };
  } catch (error) {
    console.error("Error creating multiple entries:", error);
    return { success: false, error: "failed_to_create_entries" };
  }
}

export async function getEntries(): Promise<EntryWithAccountRecord[]> {
  const currentUser = await requireCurrentUser();

  try {
    return await prisma.entry.findMany({
      where: {
        account: {
          userId: currentUser.id,
        },
      },
      include: {
        account: true,
      },
      orderBy: [{ account: { name: "asc" } }, { beginDate: "asc" }],
    });
  } catch (error) {
    console.error("Error fetching entries:", error);
    return [];
  }
}

export async function getRecentEntries(
  limit: number = 10,
): Promise<EntryWithAccountRecord[]> {
  const currentUser = await requireCurrentUser();

  try {
    return await prisma.entry.findMany({
      where: {
        account: {
          userId: currentUser.id,
        },
      },
      include: {
        account: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  } catch (error) {
    console.error("Error fetching recent entries:", error);
    return [];
  }
}

export async function getCurrentMonthTotals(): Promise<DashboardTotals> {
  const currentUser = await requireCurrentUser();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  type TotalsRow = {
    income: number | null;
    expense: number | null;
    net: number | null;
  };

  try {
    const rows = await prisma.$queryRaw<TotalsRow[]>`
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
        ) AS expense,
        COALESCE(
          SUM(
            CASE
              WHEN e.type = 'expense' AND e.amount > 0 THEN -e.amount
              ELSE e.amount
            END
          ),
          0
        ) AS net
      FROM "Entry" e
      INNER JOIN "Account" a ON a.id = e."accountId"
      WHERE a."userId" = ${currentUser.id}
        AND e."beginDate" <= ${monthEnd}
        AND (e."endDate" IS NULL OR e."endDate" >= ${monthStart})
    `;

    const totals = rows[0];

    return {
      income: Number(totals?.income || 0),
      expense: Number(totals?.expense || 0),
      net: Number(totals?.net || 0),
    };
  } catch (error) {
    console.error("Error fetching current month totals:", error);
    return {
      income: 0,
      expense: 0,
      net: 0,
    };
  }
}

export async function getProjectionEntries(): Promise<SerializedProjectionEntry[]> {
  const entries = await getEntries();
  return entries.map(serializeProjectionEntry);
}

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [totals, recentEntries] = await Promise.all([
    getCurrentMonthTotals(),
    getRecentEntries(10),
  ]);

  return {
    totals,
    recentEntries: recentEntries.map(serializeDashboardRecentEntry),
    currentMonthRange: {
      startDate: format(monthStart, "yyyy-MM-dd"),
      endDate: format(monthEnd, "yyyy-MM-dd"),
    },
  };
}

export async function getEntriesWithFilters(filters: {
  accountId?: string;
  type?: "income" | "expense";
  date?: Date;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}): Promise<EntryListWithPagination> {
  const currentUser = await requireCurrentUser();

  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: EntryFiltersWhere = {
      account: {
        userId: currentUser.id,
      },
    };

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.description) {
      where.description = {
        contains: filters.description,
        mode: "insensitive",
      };
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

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        include: {
          account: true,
        },
        orderBy: {
          beginDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.entry.count({ where }),
    ]);

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching filtered entries:", error);
    return {
      entries: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }
}

export async function getAccounts(): Promise<AccountRecord[]> {
  const currentUser = await requireCurrentUser();

  try {
    return await prisma.account.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

export async function getEntryById(
  id: string,
): Promise<EntryWithAccountRecord | null> {
  const currentUser = await requireCurrentUser();

  try {
    return await prisma.entry.findFirst({
      where: {
        id,
        account: {
          userId: currentUser.id,
        },
      },
      include: {
        account: true,
      },
    });
  } catch (error) {
    console.error("Error fetching entry:", error);
    return null;
  }
}

export async function updateEntry(
  id: string,
  input: Partial<CreateEntryInput>,
): Promise<EntryMutationResult> {
  const currentUser = await requireCurrentUser();

  try {
    const existingEntry = await prisma.entry.findFirst({
      where: {
        id,
        account: {
          userId: currentUser.id,
        },
      },
      include: {
        account: true,
      },
    });

    if (!existingEntry) {
      return { success: false, error: "failed_to_update_entry" };
    }

    let accountId: string | undefined;

    if (input.accountName) {
      const account = await findOrCreateAccount(
        currentUser.id,
        input.accountName,
      );
      accountId = account.id;
    }

    const entry = await prisma.entry.update({
      where: { id },
      data: {
        ...(input.type && { type: input.type }),
        ...(accountId && { accountId }),
        ...(input.description && { description: input.description }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.beginDate && { beginDate: input.beginDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
      },
      include: {
        account: true,
      },
    });

    revalidateEntryPages();

    return { success: true, entry };
  } catch (error) {
    console.error("Error updating entry:", error);
    return { success: false, error: "failed_to_update_entry" };
  }
}

export async function deleteEntry(id: string) {
  const currentUser = await requireCurrentUser();

  try {
    const existingEntry = await prisma.entry.findFirst({
      where: {
        id,
        account: {
          userId: currentUser.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingEntry) {
      return { success: false, error: "failed_to_delete_entry" };
    }

    await prisma.entry.delete({
      where: { id },
    });

    revalidateEntryPages();

    return { success: true };
  } catch (error) {
    console.error("Error deleting entry:", error);
    return { success: false, error: "failed_to_delete_entry" };
  }
}
