"use server";

import { endOfMonth, startOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

type AccountActionResult = {
  success: boolean;
  error?: string;
};

type PrismaErrorWithCode = {
  code: string;
};

type AccountCurrentMonthSummaryRow = {
  id: string;
  name: string;
  currentMonthTotal: number | null;
};

type AccountCurrentMonthSummary = {
  id: string;
  name: string;
  currentMonthTotal: number;
};

type AccountDetailEntry = {
  id: string;
  type: string;
  accountName: string;
  transferAccountId: string | null;
  transferAccountName: string | null;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountDetailPageData = {
  account: {
    id: string;
    name: string;
    isArchived: boolean;
    currentMonthTotal: number;
  };
  currentMonthRelevantEntries: AccountDetailEntry[];
  allEntries: AccountDetailEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type AccountEditData = {
  id: string;
  name: string;
  isArchived: boolean;
};

function getCurrentMonthBounds(): { monthStart: Date; monthEnd: Date } {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(monthStart);

  return { monthStart, monthEnd };
}

function normalizeEntryAmount(type: string, amount: number): number {
  if (type === "expense" && amount > 0) {
    return -amount;
  }

  return amount;
}

function isPrismaErrorWithCode(error: unknown): error is PrismaErrorWithCode {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

function revalidateAccountPages(): void {
  revalidatePath("/");
  revalidatePath("/entries");
  revalidatePath("/entries/all");
  revalidatePath("/projection");
  revalidatePath("/accounts");
  revalidatePath("/accounts/new");
  revalidatePath("/accounts/archived");
  revalidatePath("/settings");
}

async function findOwnedAccountOrNull(userId: string, id: string) {
  return prisma.account.findFirst({
    where: {
      id,
      userId,
    },
  });
}

async function getCurrentMonthTotalForAccount(
  userId: string,
  accountId: string,
): Promise<number> {
  const { monthStart, monthEnd } = getCurrentMonthBounds();

  const rows = await prisma.$queryRaw<Array<{ currentMonthTotal: number | null }>>`
    SELECT
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
      ) AS "currentMonthTotal"
    FROM "Account" a
    LEFT JOIN "Entry" e
      ON e."accountId" = a.id
     AND e."beginDate" <= ${monthEnd}
     AND (e."endDate" IS NULL OR e."endDate" >= ${monthStart})
    WHERE a.id = ${accountId}
      AND a."userId" = ${userId}
    GROUP BY a.id
  `;

  return Number(rows[0]?.currentMonthTotal || 0);
}

async function getAccountsByArchiveState(
  isArchived: boolean,
): Promise<AccountCurrentMonthSummary[]> {
  const currentUser = await requireCurrentUser();
  const { monthStart, monthEnd } = getCurrentMonthBounds();

  try {
    const rows = await prisma.$queryRaw<AccountCurrentMonthSummaryRow[]>`
      SELECT
        a.id,
        a.name,
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
        ) AS "currentMonthTotal"
      FROM "Account" a
      LEFT JOIN "Entry" e
        ON e."accountId" = a.id
       AND e."beginDate" <= ${monthEnd}
       AND (e."endDate" IS NULL OR e."endDate" >= ${monthStart})
      WHERE a."userId" = ${currentUser.id}
        AND a."isArchived" = ${isArchived}
      GROUP BY a.id, a.name
      ORDER BY a.name ASC
    `;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      currentMonthTotal: Number(row.currentMonthTotal || 0),
    }));
  } catch (error) {
    console.error("Error fetching accounts summary:", error);
    return [];
  }
}

export async function getAccountsCurrentMonthSummary(): Promise<
  AccountCurrentMonthSummary[]
> {
  return getAccountsByArchiveState(false);
}

export async function getArchivedAccountsCurrentMonthSummary(): Promise<
  AccountCurrentMonthSummary[]
> {
  return getAccountsByArchiveState(true);
}

export async function getAccountDetailPageData(input: {
  accountId: string;
  page?: number;
  limit?: number;
}): Promise<AccountDetailPageData | null> {
  const currentUser = await requireCurrentUser();

  const page = Math.max(1, input.page || 1);
  const limit = Math.max(1, input.limit || 10);
  const take = page * limit;
  const { monthStart, monthEnd } = getCurrentMonthBounds();

  try {
    const account = await findOwnedAccountOrNull(currentUser.id, input.accountId);

    if (!account) {
      return null;
    }

    const [total, allEntriesRaw, currentMonthTotal, currentMonthRelevantRaw] =
      await Promise.all([
      prisma.entry.count({
        where: {
          accountId: account.id,
        },
      }),
      prisma.entry.findMany({
        where: {
          accountId: account.id,
        },
        select: {
          id: true,
          type: true,
          transferAccountId: true,
          transferAccount: {
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
        },
        orderBy: [{ beginDate: "desc" }, { createdAt: "desc" }],
        take,
      }),
      getCurrentMonthTotalForAccount(currentUser.id, account.id),
      prisma.entry.findMany({
        where: {
          accountId: account.id,
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
        select: {
          id: true,
          type: true,
          transferAccountId: true,
          transferAccount: {
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
        },
        orderBy: [{ beginDate: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    const sortedCurrentMonthRelevantRaw = [...currentMonthRelevantRaw].sort(
      (left, right) => {
        const leftIsRecurringBucket = left.beginDate < monthStart;
        const rightIsRecurringBucket = right.beginDate < monthStart;

        if (leftIsRecurringBucket !== rightIsRecurringBucket) {
          return leftIsRecurringBucket ? -1 : 1;
        }

        if (left.beginDate.getTime() !== right.beginDate.getTime()) {
          return left.beginDate.getTime() - right.beginDate.getTime();
        }

        return left.createdAt.getTime() - right.createdAt.getTime();
      },
    );

    const serializeEntry = (entry: {
      id: string;
      type: string;
      transferAccountId: string | null;
      transferAccount: {
        name: string;
      } | null;
      description: string;
      amount: number;
      beginDate: Date;
      endDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }): AccountDetailEntry => ({
        id: entry.id,
        type: entry.type,
        accountName: account.name,
        transferAccountId: entry.transferAccountId,
        transferAccountName: entry.transferAccount?.name || null,
        description: entry.description,
        amount: normalizeEntryAmount(entry.type, entry.amount),
        beginDate: entry.beginDate.toISOString(),
        endDate: entry.endDate?.toISOString() || null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      });

    return {
      account: {
        id: account.id,
        name: account.name,
        isArchived: account.isArchived,
        currentMonthTotal,
      },
      currentMonthRelevantEntries: sortedCurrentMonthRelevantRaw.map(serializeEntry),
      allEntries: allEntriesRaw.map(serializeEntry),
      pagination: {
        page,
        limit,
        total,
        hasMore: total > allEntriesRaw.length,
      },
    };
  } catch (error) {
    console.error("Error fetching account detail page data:", error);
    return null;
  }
}

export async function getAccountForEdit(id: string): Promise<AccountEditData | null> {
  const currentUser = await requireCurrentUser();

  try {
    const account = await findOwnedAccountOrNull(currentUser.id, id);

    if (!account) {
      return null;
    }

    return {
      id: account.id,
      name: account.name,
      isArchived: account.isArchived,
    };
  } catch (error) {
    console.error("Error fetching account for edit:", error);
    return null;
  }
}

export async function createAccount(input: {
  name: string;
}): Promise<AccountActionResult> {
  const currentUser = await requireCurrentUser();
  const name = input.name.trim();

  if (!name) {
    return { success: false, error: "accounts_page.name_required" };
  }

  try {
    await prisma.account.create({
      data: {
        userId: currentUser.id,
        name,
      },
    });

    revalidateAccountPages();

    return { success: true };
  } catch (error) {
    if (isPrismaErrorWithCode(error) && error.code === "P2002") {
      return { success: false, error: "accounts_page.duplicate_name" };
    }

    console.error("Error creating account:", error);
    return { success: false, error: "accounts_page.create_failed" };
  }
}

export async function updateAccount(
  id: string,
  input: { name: string },
): Promise<AccountActionResult> {
  const currentUser = await requireCurrentUser();
  const name = input.name.trim();

  if (!name) {
    return { success: false, error: "account_detail_page.name_required" };
  }

  try {
    const existingAccount = await findOwnedAccountOrNull(currentUser.id, id);

    if (!existingAccount) {
      return { success: false, error: "account_detail_page.not_found" };
    }

    await prisma.account.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    revalidateAccountPages();

    return { success: true };
  } catch (error) {
    if (isPrismaErrorWithCode(error) && error.code === "P2002") {
      return { success: false, error: "account_detail_page.duplicate_name" };
    }

    console.error("Error updating account:", error);
    return { success: false, error: "account_detail_page.update_failed" };
  }
}

export async function archiveAccount(
  id: string,
  confirmationText: string,
): Promise<AccountActionResult> {
  const currentUser = await requireCurrentUser();

  if (confirmationText !== "delete") {
    return { success: false, error: "accounts_page.archive_requires_confirm" };
  }

  try {
    const existingAccount = await findOwnedAccountOrNull(currentUser.id, id);

    if (!existingAccount) {
      return { success: false, error: "account_detail_page.not_found" };
    }

    await prisma.account.update({
      where: { id },
      data: {
        isArchived: true,
      },
    });

    revalidateAccountPages();

    return { success: true };
  } catch (error) {
    console.error("Error archiving account:", error);
    return { success: false, error: "accounts_page.archive_failed" };
  }
}

export async function unarchiveAccount(id: string): Promise<AccountActionResult> {
  const currentUser = await requireCurrentUser();

  try {
    const existingAccount = await findOwnedAccountOrNull(currentUser.id, id);

    if (!existingAccount) {
      return { success: false, error: "account_detail_page.not_found" };
    }

    await prisma.account.update({
      where: { id },
      data: {
        isArchived: false,
      },
    });

    revalidateAccountPages();

    return { success: true };
  } catch (error) {
    console.error("Error unarchiving account:", error);
    return { success: false, error: "accounts_page.unarchive_failed" };
  }
}
