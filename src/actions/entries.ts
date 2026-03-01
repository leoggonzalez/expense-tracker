"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

export interface CreateEntryInput {
  type: "income" | "expense";
  accountName: string;
  description: string;
  amount: number;
  beginDate: Date;
  endDate?: Date | null;
}

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

function revalidateEntryPages() {
  revalidatePath("/");
  revalidatePath("/projection");
  revalidatePath("/entries");
  revalidatePath("/entries/all");
  revalidatePath("/account");
}

export async function createEntry(input: CreateEntryInput) {
  const currentUser = await requireCurrentUser();

  try {
    const account = await findOrCreateAccount(currentUser.id, input.accountName);

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

export async function createMultipleEntries(inputs: CreateEntryInput[]) {
  try {
    const results = [];

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

export async function getEntries() {
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

export async function getRecentEntries(limit: number = 10) {
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

export async function getEntriesWithFilters(filters: {
  accountId?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const currentUser = await requireCurrentUser();

  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EntryWhereInput = {
      account: {
        userId: currentUser.id,
      },
    };

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.description) {
      where.description = {
        contains: filters.description,
        mode: "insensitive",
      };
    }

    if (filters.startDate || filters.endDate) {
      where.beginDate = {};
      if (filters.startDate) {
        where.beginDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.beginDate.lte = filters.endDate;
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

export async function getAccounts() {
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

export async function getEntryById(id: string) {
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
) {
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
      const account = await findOrCreateAccount(currentUser.id, input.accountName);
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
