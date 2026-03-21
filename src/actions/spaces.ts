"use server";

import { endOfMonth, format, startOfMonth } from "date-fns";

import { revalidateSpaceMutationPages } from "@/lib/app_revalidation";
import { normalizeTransactionAmount } from "@/lib/amount";
import { isPrismaErrorWithCode } from "@/lib/prisma_errors";
import { Space, type SpaceTransactionRecord } from "@/lib/space";
import { requireCurrentUserAccount } from "@/lib/session";

type SpaceActionResult = {
  success: boolean;
  error?: string;
};

type SpaceCurrentMonthSummary = {
  id: string;
  name: string;
  currentMonthTotal: number;
};

export type { SpaceCurrentMonthSummary };

type SpaceDetailTransaction = {
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
  selectedMonthRelevantTransactions: SpaceDetailTransaction[];
  allTransactions: SpaceDetailTransaction[];
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

function serializeSpaceTransaction(
  spaceName: string,
  transaction: SpaceTransactionRecord,
): SpaceDetailTransaction {
  return {
    id: transaction.id,
    type: transaction.type,
    spaceName,
    transferSpaceId: transaction.transferSpaceId,
    transferSpaceName: transaction.transferSpace?.name || null,
    description: transaction.description,
    amount: normalizeTransactionAmount(transaction.type, transaction.amount),
    beginDate: transaction.beginDate.toISOString(),
    endDate: transaction.endDate?.toISOString() || null,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

// Create
export async function createSpace(input: {
  name: string;
}): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUserAccount();
  const name = input.name.trim();

  if (!name) {
    return { success: false, error: "spaces_page.name_required" };
  }

  try {
    await new Space({
      userAccountId: currentUser.id,
      name,
    }).create();

    revalidateSpaceMutationPages();

    return { success: true };
  } catch (error) {
    if (isPrismaErrorWithCode(error) && error.code === "P2002") {
      return { success: false, error: "spaces_page.duplicate_name" };
    }

    console.error("Error creating space:", error);
    return { success: false, error: "spaces_page.create_failed" };
  }
}

// Read
export async function getSpacesCurrentMonthSummary(
  selectedMonthStart?: Date,
): Promise<SpaceCurrentMonthSummary[]> {
  const currentUser = await requireCurrentUserAccount();
  const monthStart = startOfMonth(selectedMonthStart || new Date());
  const monthEnd = endOfMonth(monthStart);

  try {
    return await Space.listByArchiveStateWithMonthTotals(
      currentUser.id,
      false,
      monthStart,
      monthEnd,
    );
  } catch (error) {
    console.error("Error fetching spaces summary:", error);
    return [];
  }
}

export async function getArchivedSpacesCurrentMonthSummary(
  selectedMonthStart?: Date,
): Promise<SpaceCurrentMonthSummary[]> {
  const currentUser = await requireCurrentUserAccount();
  const monthStart = startOfMonth(selectedMonthStart || new Date());
  const monthEnd = endOfMonth(monthStart);

  try {
    return await Space.listByArchiveStateWithMonthTotals(
      currentUser.id,
      true,
      monthStart,
      monthEnd,
    );
  } catch (error) {
    console.error("Error fetching spaces summary:", error);
    return [];
  }
}

export async function getSpaceDetailPageData(input: {
  spaceId: string;
  page?: number;
  limit?: number;
  selectedMonthStart?: Date;
}): Promise<SpaceDetailPageData | null> {
  const currentUser = await requireCurrentUserAccount();
  const page = Math.max(1, input.page || 1);
  const limit = Math.max(1, input.limit || 10);
  const take = page * limit;
  const monthStart = startOfMonth(input.selectedMonthStart || new Date());
  const monthEnd = endOfMonth(monthStart);

  try {
    const detailData = await Space.getDetailPageQueryResult(
      currentUser.id,
      input.spaceId,
      monthStart,
      monthEnd,
      take,
    );

    if (!detailData) {
      return null;
    }

    return {
      selectedMonth: {
        key: format(monthStart, "yyyy-MM"),
        label: format(monthStart, "MMMM yyyy"),
      },
      space: {
        id: detailData.metrics.id,
        name: detailData.metrics.name,
        isArchived: detailData.metrics.isArchived,
        historicalTotal: detailData.metrics.historicalTotal,
        selectedMonthTotal: detailData.metrics.selectedMonthTotal,
      },
      selectedMonthRelevantTransactions:
        detailData.selectedMonthRelevantTransactions.map((transaction) =>
          serializeSpaceTransaction(detailData.metrics.name, transaction),
        ),
      allTransactions: detailData.allTransactions.map((transaction) =>
        serializeSpaceTransaction(detailData.metrics.name, transaction),
      ),
      pagination: {
        page,
        limit,
        total: detailData.metrics.transactionCount,
        hasMore: detailData.metrics.transactionCount >
          detailData.allTransactions.length,
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
  const currentUser = await requireCurrentUserAccount();

  try {
    const space = await Space.findOwnedById(currentUser.id, id);

    if (!space) {
      return null;
    }

    const spaceRecord = space.toRecord();

    return {
      id: spaceRecord.id,
      name: spaceRecord.name,
      isArchived: spaceRecord.isArchived,
    };
  } catch (error) {
    console.error("Error fetching space for edit:", error);
    return null;
  }
}

// Update
export async function updateSpace(
  id: string,
  input: { name: string },
): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUserAccount();
  const name = input.name.trim();

  if (!name) {
    return { success: false, error: "space_detail_page.name_required" };
  }

  try {
    const space = await Space.findOwnedById(currentUser.id, id);

    if (!space) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    await space.updateName(name);
    revalidateSpaceMutationPages();

    return { success: true };
  } catch (error) {
    if (isPrismaErrorWithCode(error) && error.code === "P2002") {
      return { success: false, error: "space_detail_page.duplicate_name" };
    }

    console.error("Error updating space:", error);
    return { success: false, error: "space_detail_page.update_failed" };
  }
}

// Delete/Archive
export async function archiveSpace(
  id: string,
  confirmationText: string,
): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUserAccount();

  if (confirmationText !== "delete") {
    return { success: false, error: "spaces_page.archive_requires_confirm" };
  }

  try {
    const space = await Space.findOwnedById(currentUser.id, id);

    if (!space) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    await space.archive();
    revalidateSpaceMutationPages();

    return { success: true };
  } catch (error) {
    console.error("Error archiving space:", error);
    return { success: false, error: "spaces_page.archive_failed" };
  }
}

export async function unarchiveSpace(
  id: string,
): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const space = await Space.findOwnedById(currentUser.id, id);

    if (!space) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    await space.unarchive();
    revalidateSpaceMutationPages();

    return { success: true };
  } catch (error) {
    console.error("Error unarchiving space:", error);
    return { success: false, error: "spaces_page.unarchive_failed" };
  }
}
