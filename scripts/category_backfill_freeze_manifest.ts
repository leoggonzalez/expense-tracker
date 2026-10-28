import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { TransactionCategory } from "@prisma/client";

import { normalizeTransactionDescription } from "@/lib/category_matching";

import {
  CategoryBackfillProposal,
  CategoryBackfillReview,
} from "./category_backfill_models";

/** Freeze approved decisions and expected record versions into an immutable artifact; never apply them. */
async function main(): Promise<void> {
  const proposalPath = process.argv[2];
  const reviewPath = process.argv[3];
  if (!proposalPath || !reviewPath) {
    throw new Error(
      "Usage: yarn category:backfill:freeze-manifest <proposal-report.json> <review.json>",
    );
  }
  const proposalModel = await CategoryBackfillProposal.read(proposalPath);
  const reviewModel = await CategoryBackfillReview.read(
    reviewPath,
    proposalModel,
  );
  const proposal = proposalModel.data;
  const review = reviewModel.data;
  const reviewByGroup = reviewModel.validateForFreeze();

  const manifestAssignments = proposal.assignments.flatMap((assignment) => {
    const group = reviewByGroup.get(
      CategoryBackfillProposal.groupId(
        assignment.accountId,
        assignment.normalizedDescription,
        assignment.transactionType,
      ),
    )!;
    if (
      group.decision !== "approved" ||
      assignment.internalTransfer ||
      assignment.currentSource === "manual"
    ) {
      return [];
    }
    return [
      {
        transactionId: assignment.transactionId,
        accountId: assignment.accountId,
        expectedDescription: assignment.description,
        expectedNormalizedDescription: assignment.normalizedDescription,
        expectedType: assignment.transactionType,
        expectedUpdatedAt: assignment.updatedAt,
        previousCategory: assignment.currentCategory,
        previousSource: assignment.currentSource,
        proposedCategory: group.approvedCategory as TransactionCategory,
        proposedSource: "backfill" as const,
        reason: assignment.reason,
        confidence: assignment.confidence,
      },
    ];
  });

  const learnedKeys = new Set<string>();
  const approvedLearnedMappings = review.approvedLearnedMappings.map(
    (mapping) => {
      const normalizedDescription = normalizeTransactionDescription(
        mapping.normalizedDescription,
      );
      const key = CategoryBackfillProposal.groupKey(
        mapping.accountId,
        normalizedDescription,
        mapping.transactionType,
      );
      if (
        !normalizedDescription ||
        normalizedDescription !== mapping.normalizedDescription ||
        !["income", "expense"].includes(mapping.transactionType) ||
        !Object.values(TransactionCategory).includes(
          mapping.category as TransactionCategory,
        ) ||
        learnedKeys.has(key)
      ) {
        throw new Error(
          "Approved learned mappings must be normalized, valid, and unique.",
        );
      }
      learnedKeys.add(key);
      const matchingAssignments = manifestAssignments.filter(
        (assignment) =>
          assignment.accountId === mapping.accountId &&
          assignment.expectedNormalizedDescription === normalizedDescription &&
          assignment.expectedType === mapping.transactionType,
      );
      if (
        matchingAssignments.some(
          (assignment) => assignment.proposedCategory !== mapping.category,
        )
      ) {
        throw new Error(
          "Learned mapping conflicts with an approved transaction assignment.",
        );
      }
      const sample = proposal.assignments.find(
        (assignment) =>
          assignment.accountId === mapping.accountId &&
          assignment.normalizedDescription === normalizedDescription &&
          assignment.transactionType === mapping.transactionType,
      );
      if (!sample)
        throw new Error("Learned mapping has no reviewed transaction group.");
      const expectedRulesVersion =
        proposal.accountRulesVersions[mapping.accountId];
      if (!Number.isInteger(expectedRulesVersion)) {
        throw new Error(
          "Learned mapping account rules version is missing from the proposal.",
        );
      }
      return {
        accountId: mapping.accountId,
        normalizedDescription,
        transactionType: mapping.transactionType,
        category: mapping.category as TransactionCategory,
        expectedCurrentCategory: sample.currentLearnedCategory,
        expectedRulesVersion,
      };
    },
  );

  const manifest = {
    runId: randomUUID(),
    proposalRunId: proposal.runId,
    proposalChecksum: proposal.checksum,
    targetDatabase: proposal.targetDatabase,
    schemaVersion: proposal.targetDatabase.schemaVersion,
    normalizationVersion: proposal.normalizationVersion,
    rulesVersion: proposal.rulesVersion,
    defaultsVersion: proposal.defaultsVersion,
    reviewStatus: "approved",
    reviewedBy: review.reviewedBy,
    reviewedAt: review.reviewedAt,
    frozenAt: new Date().toISOString(),
    assignments: manifestAssignments,
    approvedLearnedMappings,
  };
  const frozenChecksum = CategoryBackfillProposal.checksum(manifest);
  const outputPath = join(
    "/private/tmp",
    `currento-category-manifest-${manifest.runId}.json`,
  );
  await writeFile(
    outputPath,
    JSON.stringify({ ...manifest, checksum: frozenChecksum }, null, 2),
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    JSON.stringify({
      manifestPath: outputPath,
      checksum: frozenChecksum,
      approvedAssignments: manifestAssignments.length,
      approvedLearnedMappings: approvedLearnedMappings.length,
      writesApplied: false,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Manifest freezing failed.",
  );
  process.exitCode = 1;
});
