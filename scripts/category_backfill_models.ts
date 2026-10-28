import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { TransactionCategory } from "@prisma/client";

/** Serialized transaction snapshot, including the record version used by later review steps. */
export type CategoryBackfillAssignment = {
  transactionId: string;
  accountId: string;
  spaceId: string;
  spaceName: string;
  isArchivedSpace: boolean;
  description: string;
  normalizedDescription: string;
  transactionType: string;
  updatedAt: string;
  currentCategory: string;
  currentSource: string;
  currentLearnedCategory: string | null;
  proposedCategory: string | null;
  proposedSource: string | null;
  reason: string;
  confidence: number;
  unresolved: boolean;
  internalTransfer: boolean;
  amount: number;
  beginDate: string;
  endDate: string | null;
};

/** Account-scoped summary of transactions sharing a normalized description and type. */
export type CategoryBackfillGroup = {
  accountId: string;
  normalizedDescription: string;
  transactionType: string;
  transactionCount: number;
  originalDescriptionVariants: Array<{ description: string; count: number }>;
  currentCategoryCounts: Array<{ category: string; count: number }>;
  proposedCategories: string[];
  reasons: string[];
  unresolvedCount: number;
  ambiguous: boolean;
  needsReview: boolean;
  transactionIds: string[];
  amountRange: { minimum: number; maximum: number };
  dateRange: { earliest: string | null; latest: string | null };
  representatives: Array<{
    transactionId: string;
    description: string;
    currentCategory: string;
    currentSource: string;
    proposedCategory: string | null;
    proposedSource: string | null;
    confidence: number;
    unresolved: boolean;
    internalTransfer: boolean;
  }>;
};

/** Versioned, checksummed dry-run report; field order is preserved when verifying its hash. */
export type CategoryBackfillProposalData = {
  runId: string;
  generatedAt: string;
  checksum: string;
  targetDatabase: { host: string; database: string; schemaVersion: string };
  normalizationVersion: number;
  rulesVersion: number;
  defaultsVersion?: string;
  accountRulesVersions: Record<string, number>;
  reviewStatus: string;
  dryRun: boolean;
  transactionCount: number;
  groupCount: number;
  unresolvedCount: number;
  internalTransferCount: number;
  assignments: CategoryBackfillAssignment[];
  groupedProposals: CategoryBackfillGroup[];
};

/** Editable decision for one complete proposal group. */
export type CategoryBackfillReviewGroup = {
  groupId: string;
  accountId: string;
  normalizedDescription: string;
  transactionType: string;
  transactionIds: string[];
  ambiguous: boolean;
  decision: "pending" | "approved" | "skip";
  approvedCategory: string | null;
};

/** Human review metadata and decisions tied to one exact proposal snapshot. */
export type CategoryBackfillReviewData = {
  proposalRunId: string;
  proposalChecksum: string;
  targetDatabase: CategoryBackfillProposalData["targetDatabase"];
  schemaVersion: string;
  normalizationVersion: number;
  rulesVersion: number;
  defaultsVersion?: string;
  reviewStatus: string;
  reviewedBy: string;
  reviewedAt: string | null;
  groups: CategoryBackfillReviewGroup[];
  approvedLearnedMappings: Array<{
    accountId: string;
    normalizedDescription: string;
    transactionType: "income" | "expense";
    category: string;
  }>;
};

/** Owns proposal integrity and stable identities shared by all backfill commands. */
export class CategoryBackfillProposal {
  /** Accept only verified input through {@link read} or freshly generated data through {@link create}. */
  private constructor(public readonly data: CategoryBackfillProposalData) {}

  /** Hash the serialized payload without reordering keys, preserving existing report compatibility. */
  public static checksum(value: unknown): string {
    return createHash("sha256").update(JSON.stringify(value)).digest("hex");
  }

  /** Encode account, description, and type together to prevent cross-account or cross-type matches. */
  public static groupKey(
    accountId: string,
    normalizedDescription: string,
    transactionType: string,
  ): string {
    return JSON.stringify([accountId, normalizedDescription, transactionType]);
  }

  /** Return the persisted review identity for a proposal group. */
  public static groupId(
    accountId: string,
    normalizedDescription: string,
    transactionType: string,
  ): string {
    return createHash("sha256")
      .update(this.groupKey(accountId, normalizedDescription, transactionType))
      .digest("hex");
  }

  /**
   * Load a report and verify its snapshot before exposing classification data.
   * @param path Path to a saved proposal JSON file.
   * @returns A proposal whose serialized payload matches its stored checksum.
   * @throws If the file cannot be read, parsed, or verified.
   */
  public static async read(path: string): Promise<CategoryBackfillProposal> {
    const data = JSON.parse(
      await readFile(path, "utf8"),
    ) as CategoryBackfillProposalData;
    const { checksum, ...payload } = data;
    if (this.checksum(payload) !== checksum) {
      throw new Error(
        "Proposal report checksum is invalid or the report was modified.",
      );
    }
    return new CategoryBackfillProposal(data);
  }

  /**
   * Seal a newly generated dry-run snapshot using the saved report format.
   * @param data Complete proposal payload without a checksum.
   * @returns A proposal containing the payload and its SHA-256 checksum.
   */
  public static create(
    data: Omit<CategoryBackfillProposalData, "checksum">,
  ): CategoryBackfillProposal {
    return new CategoryBackfillProposal({
      ...data,
      checksum: this.checksum(data),
    });
  }

  /**
   * Collect snapshots by stable group identity while retaining their original order.
   * @param assignments Rows to group; defaults to the complete proposal.
   * @returns Account-scoped groups containing the original snapshot objects.
   */
  public groupAssignments(
    assignments = this.data.assignments,
  ): Map<string, CategoryBackfillAssignment[]> {
    const groups = new Map<string, CategoryBackfillAssignment[]>();
    for (const assignment of assignments) {
      const key = CategoryBackfillProposal.groupKey(
        assignment.accountId,
        assignment.normalizedDescription,
        assignment.transactionType,
      );
      const group = groups.get(key) ?? [];
      group.push(assignment);
      groups.set(key, group);
    }
    return groups;
  }
}

/** Owns proposal linkage, review completeness, and unresolved-transaction selection. */
export class CategoryBackfillReview {
  /** Retain reviewed data together with the verified proposal it belongs to. */
  private constructor(
    public readonly data: CategoryBackfillReviewData,
    private readonly proposal: CategoryBackfillProposal,
  ) {}

  /**
   * Load review decisions tied to one exact proposal and classification version.
   * @param path Path to the editable review JSON file.
   * @param proposal Verified proposal that the review must reference.
   * @returns A review model linked to the supplied proposal.
   * @throws If reading, parsing, or proposal/version checks fail.
   */
  public static async read(
    path: string,
    proposal: CategoryBackfillProposal,
  ): Promise<CategoryBackfillReview> {
    const review = JSON.parse(
      await readFile(path, "utf8"),
    ) as CategoryBackfillReviewData;
    const source = proposal.data;
    if (
      review.proposalRunId !== source.runId ||
      review.proposalChecksum !== source.checksum ||
      JSON.stringify(review.targetDatabase) !==
        JSON.stringify(source.targetDatabase) ||
      review.schemaVersion !== source.targetDatabase.schemaVersion ||
      review.normalizationVersion !== source.normalizationVersion ||
      review.rulesVersion !== source.rulesVersion ||
      review.defaultsVersion !== source.defaultsVersion
    ) {
      throw new Error(
        "Review file does not match the selected proposal report.",
      );
    }
    return new CategoryBackfillReview(review, proposal);
  }

  /**
   * Require dated approval, valid categories, and exact coverage of every original transaction.
   * @returns All reviewed groups, including explicitly skipped groups, keyed by persisted identity.
   * @throws If approval is missing or a group is invalid, ambiguous, duplicated, or incomplete.
   */
  public validateForFreeze(): Map<string, CategoryBackfillReviewGroup> {
    const review = this.data;
    const proposal = this.proposal.data;
    if (
      review.reviewStatus !== "approved" ||
      !review.reviewedBy.trim() ||
      !review.reviewedAt ||
      Number.isNaN(new Date(review.reviewedAt).getTime())
    ) {
      throw new Error(
        "Review must be explicitly approved and dated before freezing.",
      );
    }

    const reviewByGroup = new Map<string, CategoryBackfillReviewGroup>();
    for (const group of review.groups) {
      const groupId = CategoryBackfillProposal.groupId(
        group.accountId,
        group.normalizedDescription,
        group.transactionType,
      );
      if (group.groupId !== groupId || reviewByGroup.has(groupId)) {
        throw new Error(
          "Review file contains a modified or duplicate group identity.",
        );
      }
      if (!["approved", "skip"].includes(group.decision)) {
        throw new Error("Every group must be approved or explicitly skipped.");
      }
      if (group.decision === "approved") {
        if (group.ambiguous) {
          throw new Error(
            `Ambiguous group ${group.normalizedDescription} needs per-transaction review.`,
          );
        }
        if (
          !group.approvedCategory ||
          !Object.values(TransactionCategory).includes(
            group.approvedCategory as TransactionCategory,
          )
        ) {
          throw new Error(
            `Approved group ${group.normalizedDescription} needs a valid category.`,
          );
        }
      }
      reviewByGroup.set(groupId, group);
    }

    const proposalGroups = new Set(
      proposal.assignments.map((assignment) =>
        CategoryBackfillProposal.groupId(
          assignment.accountId,
          assignment.normalizedDescription,
          assignment.transactionType,
        ),
      ),
    );
    if (
      reviewByGroup.size !== proposalGroups.size ||
      [...proposalGroups].some((groupId) => !reviewByGroup.has(groupId))
    ) {
      throw new Error(
        "Review file must include every proposal group exactly once.",
      );
    }
    for (const group of review.groups) {
      const expectedIds = proposal.assignments
        .filter(
          (assignment) =>
            assignment.accountId === group.accountId &&
            assignment.normalizedDescription === group.normalizedDescription &&
            assignment.transactionType === group.transactionType,
        )
        .map((assignment) => assignment.transactionId)
        .sort();
      if (
        JSON.stringify([...group.transactionIds].sort()) !==
        JSON.stringify(expectedIds)
      ) {
        throw new Error(
          "Review group transaction IDs do not match the proposal report.",
        );
      }
    }

    return reviewByGroup;
  }

  /**
   * Select unresolved non-transfer rows still awaiting manual categories.
   * @returns Original snapshots excluding transfers and groups already approved by the reviewer.
   * @throws If the overall review is no longer pending.
   */
  public unresolvedAssignments(): CategoryBackfillAssignment[] {
    if (this.data.reviewStatus !== "pending_review") {
      throw new Error(
        "Review file does not match the pending proposal report.",
      );
    }
    const decisions = new Map(
      this.data.groups.map((group) => [
        CategoryBackfillProposal.groupKey(
          group.accountId,
          group.normalizedDescription,
          group.transactionType,
        ),
        group.decision,
      ]),
    );
    return this.proposal.data.assignments.filter(
      (assignment) =>
        !assignment.internalTransfer &&
        assignment.unresolved &&
        decisions.get(
          CategoryBackfillProposal.groupKey(
            assignment.accountId,
            assignment.normalizedDescription,
            assignment.transactionType,
          ),
        ) !== "approved",
    );
  }
}
