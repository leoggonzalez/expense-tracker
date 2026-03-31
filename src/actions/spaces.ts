"use server";

import { CreditCardPaymentTiming, SpaceType } from "@prisma/client";
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

export type SpaceTypeInput = SpaceType | null;
export type CreditCardPaymentTimingInput = CreditCardPaymentTiming | null;

type SpaceCurrentMonthSummary = {
  id: string;
  name: string;
  currentMonthTotal: number;
};

export type { SpaceCurrentMonthSummary };

export type SpacesPagePayload = {
  spaces: SpaceCurrentMonthSummary[];
};

export type ArchivedSpacesPayload = {
  spaces: SpaceCurrentMonthSummary[];
};

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
  mainSpaceId: string | null;
  selectedMonth: {
    key: string;
    label: string;
  };
  space: {
    id: string;
    name: string;
    main: boolean | null;
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
  main: boolean | null;
  type: SpaceTypeInput;
  paymentDueDay: number | null;
  paymentTiming: CreditCardPaymentTimingInput;
  isArchived: boolean;
};

export type SpaceDetailPayload = SpaceDetailPageData;
export type SpaceEditPayload = SpaceEditData;

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

function normalizeSpaceType(type: string | null | undefined): SpaceTypeInput {
  return type === SpaceType.credit_card ? SpaceType.credit_card : null;
}

function normalizePaymentTiming(
  timing: string | null | undefined,
): CreditCardPaymentTimingInput {
  return timing === CreditCardPaymentTiming.same_month ||
    timing === CreditCardPaymentTiming.previous_month
    ? timing
    : null;
}

function normalizePaymentDueDay(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = Number(value);

  if (!Number.isInteger(normalized)) {
    return Number.NaN;
  }

  return normalized;
}

function validateSpaceInput(input: {
  name: string;
  type: SpaceTypeInput;
  paymentDueDay: number | null;
  paymentTiming: CreditCardPaymentTimingInput;
}): SpaceActionResult | null {
  if (!input.name) {
    return { success: false, error: "spaces_page.name_required" };
  }

  if (input.type === SpaceType.credit_card) {
    if (input.paymentDueDay === null) {
      return {
        success: false,
        error: "spaces_page.credit_card_payment_due_day_required",
      };
    }

    if (Number.isNaN(input.paymentDueDay)) {
      return {
        success: false,
        error: "spaces_page.credit_card_payment_due_day_invalid",
      };
    }

    if (input.paymentDueDay < 1 || input.paymentDueDay > 31) {
      return {
        success: false,
        error: "spaces_page.credit_card_payment_due_day_invalid",
      };
    }

    if (input.paymentTiming === null) {
      return {
        success: false,
        error: "spaces_page.credit_card_payment_timing_required",
      };
    }

    return null;
  }

  if (input.paymentDueDay !== null && !Number.isNaN(input.paymentDueDay)) {
    return {
      success: false,
      error: "spaces_page.payment_due_day_requires_credit_card",
    };
  }

  if (input.paymentTiming !== null) {
    return {
      success: false,
      error: "spaces_page.payment_timing_requires_credit_card",
    };
  }

  return null;
}

// Create
export async function createSpace(input: {
  name: string;
  main?: boolean | null;
  type?: SpaceTypeInput;
  paymentDueDay?: number | null;
  paymentTiming?: CreditCardPaymentTimingInput;
}): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUserAccount();
  const name = input.name.trim();
  const type = normalizeSpaceType(input.type);
  const paymentDueDay = normalizePaymentDueDay(input.paymentDueDay);
  const paymentTiming = normalizePaymentTiming(input.paymentTiming);
  const validationError = validateSpaceInput({
    name,
    type,
    paymentDueDay,
    paymentTiming,
  });

  if (validationError) {
    return validationError;
  }

  try {
    const createdSpace = await new Space({
      userAccountId: currentUser.id,
      name,
      main: input.main ?? null,
      type,
      paymentDueDay: type === SpaceType.credit_card ? paymentDueDay : null,
      paymentTiming: type === SpaceType.credit_card ? paymentTiming : null,
    }).create();

    if (input.main) {
      await Space.setMainStatusForUser(
        currentUser.id,
        createdSpace.persistedId,
        true,
      );
    }

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
export async function getSpacesPagePayloadForUser(
  userAccountId: string,
  selectedMonthStart?: Date,
): Promise<SpacesPagePayload> {
  const monthStart = startOfMonth(selectedMonthStart || new Date());
  const monthEnd = endOfMonth(monthStart);

  return {
    spaces: await Space.listByArchiveStateWithMonthTotals(
      userAccountId,
      false,
      monthStart,
      monthEnd,
    ),
  };
}

export async function getArchivedSpacesPayloadForUser(
  userAccountId: string,
  selectedMonthStart?: Date,
): Promise<ArchivedSpacesPayload> {
  const monthStart = startOfMonth(selectedMonthStart || new Date());
  const monthEnd = endOfMonth(monthStart);

  return {
    spaces: await Space.listByArchiveStateWithMonthTotals(
      userAccountId,
      true,
      monthStart,
      monthEnd,
    ),
  };
}

export async function getSpaceDetailPayloadForUser(
  userAccountId: string,
  input: {
    spaceId: string;
    page?: number;
    limit?: number;
    selectedMonthStart?: Date;
  },
): Promise<SpaceDetailPayload | null> {
  const page = Math.max(1, input.page || 1);
  const limit = Math.max(1, input.limit || 10);
  const take = page * limit;
  const monthStart = startOfMonth(input.selectedMonthStart || new Date());
  const monthEnd = endOfMonth(monthStart);
  const [detailData, mainSpace] = await Promise.all([
    Space.getDetailPageQueryResult(
      userAccountId,
      input.spaceId,
      monthStart,
      monthEnd,
      take,
    ),
    Space.findMainByUser(userAccountId),
  ]);

  if (!detailData) {
    return null;
  }

  return {
    mainSpaceId: mainSpace?.toRecord().id || null,
    selectedMonth: {
      key: format(monthStart, "yyyy-MM"),
      label: format(monthStart, "MMMM yyyy"),
    },
    space: {
      id: detailData.metrics.id,
      name: detailData.metrics.name,
      main: detailData.metrics.main,
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
      hasMore:
        detailData.metrics.transactionCount > detailData.allTransactions.length,
    },
  };
}

export async function getSpaceEditPayloadForUser(
  userAccountId: string,
  id: string,
): Promise<SpaceEditPayload | null> {
  const space = await Space.findOwnedById(userAccountId, id);

  if (!space) {
    return null;
  }

  const spaceRecord = space.toRecord();

  return {
    id: spaceRecord.id,
    name: spaceRecord.name,
    main: spaceRecord.main,
    type: spaceRecord.type,
    paymentDueDay: spaceRecord.paymentDueDay,
    paymentTiming: spaceRecord.paymentTiming,
    isArchived: spaceRecord.isArchived,
  };
}

export async function getSpacesCurrentMonthSummary(
  selectedMonthStart?: Date,
): Promise<SpaceCurrentMonthSummary[]> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const payload = await getSpacesPagePayloadForUser(
      currentUser.id,
      selectedMonthStart,
    );

    return payload.spaces;
  } catch (error) {
    console.error("Error fetching spaces summary:", error);
    return [];
  }
}

export async function getArchivedSpacesCurrentMonthSummary(
  selectedMonthStart?: Date,
): Promise<SpaceCurrentMonthSummary[]> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const payload = await getArchivedSpacesPayloadForUser(
      currentUser.id,
      selectedMonthStart,
    );

    return payload.spaces;
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

  try {
    return await getSpaceDetailPayloadForUser(currentUser.id, input);
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
    return await getSpaceEditPayloadForUser(currentUser.id, id);
  } catch (error) {
    console.error("Error fetching space for edit:", error);
    return null;
  }
}

// Update
export async function updateSpace(
  id: string,
  input: {
    name: string;
    main?: boolean | null;
    type?: SpaceTypeInput;
    paymentDueDay?: number | null;
    paymentTiming?: CreditCardPaymentTimingInput;
  },
): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUserAccount();
  const name = input.name.trim();
  const type = normalizeSpaceType(input.type);
  const paymentDueDay = normalizePaymentDueDay(input.paymentDueDay);
  const paymentTiming = normalizePaymentTiming(input.paymentTiming);
  const validationError = validateSpaceInput({
    name,
    type,
    paymentDueDay,
    paymentTiming,
  });

  if (validationError) {
    return {
      success: false,
      error:
        validationError.error === "spaces_page.name_required"
          ? "space_detail_page.name_required"
          : validationError.error,
    };
  }

  try {
    const space = await Space.findOwnedById(currentUser.id, id);

    if (!space) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    const nextMain = input.main ?? space.toRecord().main;

    await space.updateDetails({
      name,
      main: nextMain,
      type,
      paymentDueDay: type === SpaceType.credit_card ? paymentDueDay : null,
      paymentTiming: type === SpaceType.credit_card ? paymentTiming : null,
    });

    if (nextMain) {
      await Space.setMainStatusForUser(currentUser.id, id, true);
    }

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

export async function setSpaceMainStatus(
  id: string,
  main: boolean | null,
): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUserAccount();

  try {
    const space = await Space.findOwnedById(currentUser.id, id);

    if (!space) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    if (space.toRecord().isArchived) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    await Space.setMainStatusForUser(currentUser.id, id, main);
    revalidateSpaceMutationPages();

    return { success: true };
  } catch (error) {
    console.error("Error updating main space:", error);
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

export async function unarchiveSpace(id: string): Promise<SpaceActionResult> {
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
