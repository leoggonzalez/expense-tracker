"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

type AccountActionResult = {
  success: boolean;
  error?: string;
};

type AccountSummary = {
  id: string;
  name: string;
  entryCount: number;
  allTimeNet: number;
};

type AccountSummaryRecord = Prisma.AccountGetPayload<{
  include: {
    entries: {
      select: {
        id: true;
        type: true;
        amount: true;
      };
    };
  };
}>;

type AccountDetail = {
  id: string;
  name: string;
  entryCount: number;
  allTimeNet: number;
  entries: Array<{
    id: string;
    type: string;
    description: string;
    amount: number;
    beginDate: Date;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

type AccountDetailRecord = Prisma.AccountGetPayload<{
  include: {
    entries: true;
  };
}>;

type AccountDeleteCheckRecord = Prisma.AccountGetPayload<{
  include: {
    _count: {
      select: {
        entries: true;
      };
    };
  };
}>;

function revalidateAccountPages(): void {
  revalidatePath("/");
  revalidatePath("/entries");
  revalidatePath("/entries/all");
  revalidatePath("/projection");
  revalidatePath("/accounts");
  revalidatePath("/settings");
}

function getEntryNet(entry: { type: string; amount: number }): number {
  return entry.type === "expense" && entry.amount > 0
    ? -entry.amount
    : entry.amount;
}

async function findOwnedAccountOrNull(userId: string, id: string) {
  return prisma.account.findFirst({
    where: {
      id,
      userId,
    },
  });
}

export async function getAccountsWithSummary(): Promise<AccountSummary[]> {
  const currentUser = await requireCurrentUser();

  try {
    const accounts: AccountSummaryRecord[] = await prisma.account.findMany({
      where: {
        userId: currentUser.id,
      },
      include: {
        entries: {
          select: {
            id: true,
            type: true,
            amount: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return accounts.map((account) => ({
      id: account.id,
      name: account.name,
      entryCount: account.entries.length,
      allTimeNet: account.entries.reduce(
        (sum, entry) => sum + getEntryNet(entry),
        0,
      ),
    }));
  } catch (error) {
    console.error("Error fetching accounts with summary:", error);
    return [];
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, error: "accounts_page.duplicate_name" };
    }

    console.error("Error creating account:", error);
    return { success: false, error: "accounts_page.create_failed" };
  }
}

export async function getAccountById(id: string): Promise<AccountDetail | null> {
  const currentUser = await requireCurrentUser();

  try {
    const account: AccountDetailRecord | null = await prisma.account.findFirst({
      where: {
        id,
        userId: currentUser.id,
      },
      include: {
        entries: {
          orderBy: {
            beginDate: "desc",
          },
        },
      },
    });

    if (!account) {
      return null;
    }

    return {
      id: account.id,
      name: account.name,
      entryCount: account.entries.length,
      allTimeNet: account.entries.reduce(
        (sum, entry) => sum + getEntryNet(entry),
        0,
      ),
      entries: account.entries,
    };
  } catch (error) {
    console.error("Error fetching account by id:", error);
    return null;
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { success: false, error: "account_detail_page.duplicate_name" };
    }

    console.error("Error updating account:", error);
    return { success: false, error: "account_detail_page.update_failed" };
  }
}

export async function deleteAccount(id: string): Promise<AccountActionResult> {
  const currentUser = await requireCurrentUser();

  try {
    const account: AccountDeleteCheckRecord | null =
      await prisma.account.findFirst({
      where: {
        id,
        userId: currentUser.id,
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });

    if (!account) {
      return { success: false, error: "account_detail_page.not_found" };
    }

    if (account._count.entries > 0) {
      return {
        success: false,
        error: "account_detail_page.delete_blocked_has_entries",
      };
    }

    await prisma.account.delete({
      where: {
        id,
      },
    });

    revalidateAccountPages();

    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: "account_detail_page.delete_failed" };
  }
}
