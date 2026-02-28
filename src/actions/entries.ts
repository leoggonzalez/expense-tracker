"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CreateEntryInput {
  type: "income" | "expense";
  groupName: string;
  description: string;
  amount: number;
  beginDate: Date;
  endDate?: Date | null;
}

export async function createEntry(input: CreateEntryInput) {
  try {
    // Find or create group
    let group = await prisma.group.findUnique({
      where: { name: input.groupName },
    });

    if (!group) {
      group = await prisma.group.create({
        data: { name: input.groupName },
      });
    }

    const entry = await prisma.entry.create({
      data: {
        type: input.type,
        groupId: group.id,
        description: input.description,
        amount: input.amount,
        beginDate: input.beginDate,
        endDate: input.endDate || null,
      },
      include: {
        group: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/projection");
    revalidatePath("/entries");

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
  try {
    const entries = await prisma.entry.findMany({
      include: {
        group: true,
      },
      orderBy: [{ group: { name: "asc" } }, { beginDate: "asc" }],
    });

    return entries;
  } catch (error) {
    console.error("Error fetching entries:", error);
    return [];
  }
}

export async function getRecentEntries(limit: number = 10) {
  try {
    const entries = await prisma.entry.findMany({
      include: {
        group: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return entries;
  } catch (error) {
    console.error("Error fetching recent entries:", error);
    return [];
  }
}

export async function getEntriesWithFilters(filters: {
  groupId?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EntryWhereInput = {};

    if (filters.groupId) {
      where.groupId = filters.groupId;
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
          group: true,
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

export async function getGroups() {
  try {
    const groups = await prisma.group.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return groups;
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
}

export async function getEntryById(id: string) {
  try {
    const entry = await prisma.entry.findUnique({
      where: { id },
      include: {
        group: true,
      },
    });

    return entry;
  } catch (error) {
    console.error("Error fetching entry:", error);
    return null;
  }
}

export async function updateEntry(
  id: string,
  input: Partial<CreateEntryInput>,
) {
  try {
    let groupId: string | undefined;

    if (input.groupName) {
      let group = await prisma.group.findUnique({
        where: { name: input.groupName },
      });

      if (!group) {
        group = await prisma.group.create({
          data: { name: input.groupName },
        });
      }

      groupId = group.id;
    }

    const entry = await prisma.entry.update({
      where: { id },
      data: {
        ...(input.type && { type: input.type }),
        ...(groupId && { groupId }),
        ...(input.description && { description: input.description }),
        ...(input.amount !== undefined && { amount: input.amount }),
        ...(input.beginDate && { beginDate: input.beginDate }),
        ...(input.endDate !== undefined && { endDate: input.endDate }),
      },
      include: {
        group: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/projection");
    revalidatePath("/entries");

    return { success: true, entry };
  } catch (error) {
    console.error("Error updating entry:", error);
    return { success: false, error: "failed_to_update_entry" };
  }
}

export async function deleteEntry(id: string) {
  try {
    await prisma.entry.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/projection");
    revalidatePath("/entries");

    return { success: true };
  } catch (error) {
    console.error("Error deleting entry:", error);
    return { success: false, error: "failed_to_delete_entry" };
  }
}
