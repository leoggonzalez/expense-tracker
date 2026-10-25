"use server";

import { CreditCardPaymentTiming, SpaceType } from "@prisma/client";
import { endOfMonth, format, startOfMonth } from "date-fns";

import { revalidateSpaceMutationPages } from "@/lib/app_revalidation";
import { normalizeTransactionAmount } from "@/lib/amount";
import { isPrismaErrorWithCode } from "@/lib/prisma_errors";
import { SpaceMember } from "@/lib/space_member";
import { getOtherParticipantNames } from "@/lib/transaction_split";
import type {
  MemberInput,
  MemberMonthTotal,
  SplitMember,
} from "@/lib/transaction_split";
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
  participantNames: string[];
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
    members: SplitMember[];
    id: string;
    name: string;
    main: boolean | null;
    type: SpaceTypeInput;
    paymentDueDay: number | null;
    paymentTiming: CreditCardPaymentTimingInput;
    periodEndDay: number | null;
    isArchived: boolean;
    historicalTotal: number;
    selectedMonthTotal: number;
  };
  memberTotals: MemberMonthTotal[];
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
  members: SplitMember[];
  id: string;
  name: string;
  main: boolean | null;
  type: SpaceTypeInput;
  paymentDueDay: number | null;
  paymentTiming: CreditCardPaymentTimingInput;
  periodEndDay: number | null;
  isArchived: boolean;
};

export type SpaceDetailPayload = SpaceDetailPageData;
export type SpaceEditPayload = SpaceEditData;

function serializeSpaceTransaction(
  spaceName: string,
  transaction: SpaceTransactionRecord,
  ownerId: string,
  members: SplitMember[],
): SpaceDetailTransaction {
  return {
    participantNames: getOtherParticipantNames(
      transaction.splitParticipantIds,
      ownerId,
      members,
    ),
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
  periodEndDay: number | null;
  allowLegacyPeriod?: boolean;
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

    if (input.periodEndDay === null && input.allowLegacyPeriod) {
      return null;
    }

    if (input.periodEndDay === null) {
      return {
        success: false,
        error: "spaces_page.credit_card_period_end_day_required",
      };
    }

    if (Number.isNaN(input.periodEndDay)) {
      return {
        success: false,
        error: "spaces_page.credit_card_period_end_day_invalid",
      };
    }

    if (input.periodEndDay < 1 || input.periodEndDay > 31) {
      return {
        success: false,
        error: "spaces_page.credit_card_period_end_day_invalid",
      };
    }

    return null;
  }

  if (input.paymentDueDay !== null || input.periodEndDay !== null) {
    return {
      success: false,
      error: "spaces_page.credit_card_fields_require_credit_card",
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
  members?: MemberInput[];
  periodEndDay?: number | null;
}): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUserAccount();
  const name = input.name.trim();
  const type = normalizeSpaceType(input.type);
  const paymentDueDay = normalizePaymentDueDay(input.paymentDueDay);
  const periodEndDay = normalizePaymentDueDay(input.periodEndDay);
  const validationError = validateSpaceInput({
    name,
    type,
    paymentDueDay,
    periodEndDay,
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
      paymentTiming: null,
      periodEndDay: type === SpaceType.credit_card ? periodEndDay : null,
    }).create(input.members);

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

    if (
      error instanceof Error &&
      error.message === "spaces_page.invalid_members"
    )
      return { success: false, error: error.message };
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

  const [memberTotals, members] = await Promise.all([
    SpaceMember.getMonthTotalsForSpaces(
      userAccountId,
      [input.spaceId],
      monthStart,
      monthEnd,
    ),
    SpaceMember.listForSpaces(userAccountId, [input.spaceId]),
  ]);
  return {
    memberTotals: memberTotals[input.spaceId] || [],
    mainSpaceId: mainSpace?.toRecord().id || null,
    selectedMonth: {
      key: format(monthStart, "yyyy-MM"),
      label: format(monthStart, "MMMM yyyy"),
    },
    space: {
      members: (members[input.spaceId] || []).filter(
        (member) => !member.isRemoved,
      ),
      id: detailData.metrics.id,
      name: detailData.metrics.name,
      main: detailData.metrics.main,
      type: detailData.metrics.type,
      paymentDueDay: detailData.metrics.paymentDueDay,
      paymentTiming: detailData.metrics.paymentTiming,
      periodEndDay: detailData.metrics.periodEndDay,
      isArchived: detailData.metrics.isArchived,
      historicalTotal: detailData.metrics.historicalTotal,
      selectedMonthTotal: detailData.metrics.selectedMonthTotal,
    },
    selectedMonthRelevantTransactions:
      detailData.selectedMonthRelevantTransactions.map((transaction) =>
        serializeSpaceTransaction(
          detailData.metrics.name,
          transaction,
          userAccountId,
          members[input.spaceId] || [],
        ),
      ),
    allTransactions: detailData.allTransactions.map((transaction) =>
      serializeSpaceTransaction(
        detailData.metrics.name,
        transaction,
        userAccountId,
        members[input.spaceId] || [],
      ),
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
  const members = await SpaceMember.listForSpaces(userAccountId, [id]);

  return {
    members: (members[id] || []).filter((member) => !member.isRemoved),
    id: spaceRecord.id,
    name: spaceRecord.name,
    main: spaceRecord.main,
    type: spaceRecord.type,
    paymentDueDay: spaceRecord.paymentDueDay,
    paymentTiming: spaceRecord.paymentTiming,
    periodEndDay: spaceRecord.periodEndDay,
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
    members?: MemberInput[];
    periodEndDay?: number | null;
  },
): Promise<SpaceActionResult> {
  const currentUser = await requireCurrentUserAccount();
  const name = input.name.trim();
  const type = normalizeSpaceType(input.type);
  const paymentDueDay = normalizePaymentDueDay(input.paymentDueDay);
  const periodEndDay = normalizePaymentDueDay(input.periodEndDay);
  try {
    const space = await Space.findOwnedById(currentUser.id, id);

    if (!space) {
      return { success: false, error: "space_detail_page.not_found" };
    }

    const existing = space.toRecord();
    const allowLegacyPeriod =
      existing.type === SpaceType.credit_card && existing.periodEndDay === null;
    const nextPeriodEndDay =
      input.periodEndDay === undefined ? existing.periodEndDay : periodEndDay;
    const validationError = validateSpaceInput({
      name,
      type,
      paymentDueDay,
      periodEndDay:
        type === SpaceType.credit_card ? nextPeriodEndDay : periodEndDay,
      allowLegacyPeriod,
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

    const nextMain = input.main ?? space.toRecord().main;

    await space.updateDetails({
      members: input.members,
      name,
      main: nextMain,
      type,
      paymentDueDay: type === SpaceType.credit_card ? paymentDueDay : null,
      paymentTiming:
        type === SpaceType.credit_card && nextPeriodEndDay === null
          ? existing.paymentTiming
          : null,
      periodEndDay: type === SpaceType.credit_card ? nextPeriodEndDay : null,
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

    if (
      error instanceof Error &&
      error.message === "spaces_page.invalid_members"
    )
      return { success: false, error: error.message };
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
