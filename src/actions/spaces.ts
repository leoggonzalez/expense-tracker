"use server";

import { endOfMonth, format, startOfMonth } from "date-fns";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

type SpaceActionResult = {
  success: boolean;
  error?: string;
};

type PrismaErrorWithCode = {
  code: string;
};

type SpaceCurrentMonthSummaryRow = {
  id: string;
  name: string;
  currentMonthTotal: number | null;
};

type SpaceCurrentMonthSummary = {
  id: string;
  name: string;
  currentMonthTotal: number;
};

export type { SpaceCurrentMonthSummary };

type SpaceDetailEntry = {
  id: string;
  type: string;
  spaceName: string;
  transferSpaceId: string | null;
  transferSpaceName: string | null;
  description: string;
  amount: number;
  beginDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SpaceDetailPageData = {
  selectedMonth: {
    key: string;
    label: string;
  };
  space: {
    id: string;
    name: string;
    isArchived: boolean;
    historicalTotal: number;
    selectedMonthTotal: number;
  };
  selectedMonthRelevantEntries: SpaceDetailEntry[];
  allEntries: SpaceDetailEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type SpaceEditData = {
  id: string;
  name: string;
  isArchived: boolean;
};

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

function revalidateSpacePages(): void {
  revalidatePath("/");
  revalidatePath("/entries");
  revalidatePath("/entries/all");
  revalidatePath("/projection");
  revalidatePath("/spaces");
  revalidatePath("/spaces/new");
  revalidatePath("/spaces/archived");
  revalidatePath("/settings");
}

async function findOwnedSpaceOrNull(userId: string, id: string) {
  return prisma.space.findFirst({
    where: {
      id,
      userId,
    },
  });
}

async function getMonthTotalForSpace(
  userId: string,
  spaceId: string,
  monthStart: Date,
  monthEnd: Date,
): Promise<number> {
  const rows = await prisma.$queryRaw<
    Array<{ currentMonthTotal: number | null }>
  >`
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
    FROM "Space" a
    LEFT JOIN "Entry" e
      ON e."spaceId" = a.id
     AND e."beginDate" <= ${monthEnd}
     AND (e."endDate" IS NULL OR e."endDate" >= ${monthStart})
    WHERE a.id = ${spaceId}
      AND a."userId" = ${userId}
    GROUP BY a.id
  `;

  return Number(rows[0]?.currentMonthTotal || 0);
}

async function getHistoricalTotalForSpace(
  userId: string,
  spaceId: string,
): Promise<number> {
  const rows = await prisma.$queryRaw<
    Array<{ historicalTotal: number | null }>
  >`
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
      ) AS "historicalTotal"
    FROM "Space" a
    LEFT JOIN "Entry" e
      ON e."spaceId" = a.id
    WHERE a.id = ${spaceId}
      AND a."userId" = ${userId}
    GROUP BY a.id
  `;

  return Number(rows[0]?.historicalTotal || 0);
}

async function getSpacesByArchiveState(
  isArchived: boolean,
  selectedMonthStart?: Date,
): Promise<SpaceCurrentMonthSummary[]> {
  const currentUser = await requireCurrentUser();
  const monthStart = startOfMonth(selectedMonthStart || new Date());
  const monthEnd = endOfMonth(monthStart);

  try {
    const rows = await prisma.$queryRaw<SpaceCurrentMonthSummaryRow[]>`
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
      FROM "Space" a
      LEFT JOIN "Entry" e
        ON e."spaceId" = a.id
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
    console.error("Error fetching spaces summary:", error);
    return [];
  }
}

export async function getSpacesCurrentMonthSummary(
  selectedMonthStart?: Date,
): Promise<SpaceCurrentMonthSummary[]> {
  return getSpacesByArchiveState(false, selectedMonthStart);
}

export async function getArchivedSpacesCurrentMonthSummary(
  selectedMonthStart?: Date,
): Promise<SpaceCurrentMonthSummary[]> {
  return getSpacesByArchiveState(true, selectedMonthStart);
}

export async function getSpaceDetailPageData(input: {
  spaceId: string;
  page?: number;
  limit?: number;
  selectedMonthStart?: Date;
}): Promise<SpaceDetailPageData | null> {
  const currentUser = await requireCurrentUser();

  const page = Math.max(1, input.page || 1);
  const limit = Math.max(1, input.limit || 10);
  const take = page * limit;
  const monthStart = startOfMonth(input.selectedMonthStart || new Date());
  const monthEnd = endOfMonth(monthStart);

  try {
    const space = await findOwnedSpaceOrNull(
      currentUser.id,
      input.spaceId,
    );

    if (!space) {
      return null;
    }

    const [
      total,
      allEntriesRaw,
      selectedMonthTotal,
      historicalTotal,
      selectedMonthRelevantRaw,
    ] = await Promise.all([
      prisma.entry.count({
        where: {
          spaceId: space.id,
        },
      }),
      prisma.entry.findMany({
        where: {
          spaceId: space.id,
        },
        select: {
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
        },
        orderBy: [{ beginDate: "desc" }, { createdAt: "desc" }],
        take,
      }),
      getMonthTotalForSpace(currentUser.id, space.id, monthStart, monthEnd),
      getHistoricalTotalForSpace(currentUser.id, space.id),
      prisma.entry.findMany({
        where: {
          spaceId: space.id,
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
        },
        orderBy: [{ beginDate: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    const sortedSelectedMonthRelevantRaw = [...selectedMonthRelevantRaw].sort(
      (left, right) => {
        if (left.beginDate.getTime() !== right.beginDate.getTime()) {
          return right.beginDate.getTime() - left.beginDate.getTime();
        }

        return right.createdAt.getTime() - left.createdAt.getTime();
      },
    );

    const serializeEntry = (entry: {
      id: string;
      type: string;
      transferSpaceId: string | null;
      transferSpace: {
        name: string;
      } | null;
      description: string;
      amount: number;
      beginDate: Date;
      endDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
    }): SpaceDetailEntry => ({
      id: entry.id,
      type: entry.type,
      spaceName: space.name,
      transferSpaceId: entry.transferSpaceId,
      transferSpaceName: entry.transferSpace?.name || null,
      description: entry.description,
      amount: normalizeEntryAmount(entry.type, entry.amount),
      beginDate: entry.beginDate.toISOString(),
      endDate: entry.endDate?.toISOString() || null,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    });

    return {
      selectedMonth: {
        key: format(monthStart, "yyyy-MM"),
        label: format(monthStart, "MMMM yyyy"),
      },
      space: {
        id: space.id,
        name: space.name,
        isArchived: space.isArchived,
        historicalTotal,
        selectedMonthTotal,
      },
      selectedMonthRelevantEntries:
        sortedSelectedMonthRelevantRaw.map(serializeEntry),
      allEntries: allEntriesRaw.map(serializeEntry),
      pagination: {
        page,
        limit,
        total,
        hasMore: total > allEntriesRaw.length,
      },
    };
  } catch (error) {
    console.error("Error fetching space detail page data:", error);
    return null;
  }
}

export async function getSpaceForEdit(
  id: string,
): Promise<SpaceEditData | null> {
  const currentUser = await requireCurrentUser();

  try {
    const space = await findOwnedSpaceOrNull(currentUser.id, id);

    if (!space) {
      return null;
    }

    return {
      id: space.id,
      name: space.name,
      isArchived: space.isArchived,
    };
  } catch (error) {
    console.error("Error fetching space for edit:", error);
    return null;
  }
}

export async function createSpace(input: {
  name: string;
}): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUser();
  const name = input.name.trim();

  if (!name) {
    return { success: false, error: "spaces_page.name_required" };
  }

  try {
    await prisma.space.create({
      data: {
        userId: currentUser.id,
        name,
      },
    });

    revalidateSpacePages();

    return { success: true };
  } catch (error) {
    if (isPrismaErrorWithCode(error) && error.code === "P2002") {
      return { success: false, error: "spaces_page.duplicate_name" };
    }

    console.error("Error creating space:", error);
    return { success: false, error: "spaces_page.create_failed" };
  }
}

export async function updateSpace(
  id: string,
  input: { name: string },
): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUser();
  const name = input.name.trim();

  if (!name) {
    return { success: false, error: "space_detail_page.name_required" };
  }

  try {
    const existingSpace = await findOwnedSpaceOrNull(currentUser.id, id);

    if (!existingSpace) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    await prisma.space.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    revalidateSpacePages();

    return { success: true };
  } catch (error) {
    if (isPrismaErrorWithCode(error) && error.code === "P2002") {
      return { success: false, error: "space_detail_page.duplicate_name" };
    }

    console.error("Error updating space:", error);
    return { success: false, error: "space_detail_page.update_failed" };
  }
}

export async function archiveSpace(
  id: string,
  confirmationText: string,
): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUser();

  if (confirmationText !== "delete") {
    return { success: false, error: "spaces_page.archive_requires_confirm" };
  }

  try {
    const existingSpace = await findOwnedSpaceOrNull(currentUser.id, id);

    if (!existingSpace) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    await prisma.space.update({
      where: { id },
      data: {
        isArchived: true,
      },
    });

    revalidateSpacePages();

    return { success: true };
  } catch (error) {
    console.error("Error archiving space:", error);
    return { success: false, error: "spaces_page.archive_failed" };
  }
}

export async function unarchiveSpace(
  id: string,
): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUser();

  try {
    const existingSpace = await findOwnedSpaceOrNull(currentUser.id, id);

    if (!existingSpace) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    await prisma.space.update({
      where: { id },
      data: {
        isArchived: false,
      },
    });

    revalidateSpacePages();

    return { success: true };
  } catch (error) {
    console.error("Error unarchiving space:", error);
    return { success: false, error: "spaces_page.unarchive_failed" };
  }
}
