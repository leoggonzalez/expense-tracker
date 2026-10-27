import { writeFile } from "node:fs/promises";

import { CategoryBackfillProposal } from "./category_backfill_models";

/** Write a pending review template without approving the overall report or changing database rows. */
async function main(): Promise<void> {
  const proposalPath = process.argv[2];
  if (!proposalPath) {
    throw new Error(
      "Usage: yarn category:backfill:review-template <proposal-report.json>",
    );
  }
  const proposal = await CategoryBackfillProposal.read(proposalPath);
  const source = proposal.data;
  const checksum = source.checksum;

  const reviewGroups = source.groupedProposals.map((group) => ({
    groupId: CategoryBackfillProposal.groupId(
      group.accountId,
      group.normalizedDescription,
      group.transactionType,
    ),
    accountId: group.accountId,
    normalizedDescription: group.normalizedDescription,
    transactionType: group.transactionType,
    transactionCount: group.transactionCount,
    transactionIds: group.transactionIds,
    originalDescriptionVariants: group.originalDescriptionVariants,
    currentCategoryCounts: group.currentCategoryCounts,
    proposedCategories: group.proposedCategories,
    reasons: group.reasons,
    unresolvedCount: group.unresolvedCount,
    ambiguous: group.ambiguous,
    needsReview: group.needsReview,
    amountRange: group.amountRange,
    dateRange: group.dateRange,
    representatives: group.representatives,
    decision:
      group.unresolvedCount === 0 &&
      group.proposedCategories.length === 1 &&
      !group.ambiguous
        ? ("approved" as const)
        : group.ambiguous
          ? ("pending" as const)
          : ("skip" as const),
    approvedCategory:
      group.proposedCategories.length === 1
        ? group.proposedCategories[0]
        : null,
    reviewerNote: "",
  }));
  const reviewTemplate = {
    proposalRunId: source.runId,
    proposalChecksum: checksum,
    targetDatabase: source.targetDatabase,
    schemaVersion: source.targetDatabase.schemaVersion,
    normalizationVersion: source.normalizationVersion,
    rulesVersion: source.rulesVersion,
    defaultsVersion: source.defaultsVersion,
    reviewStatus: "pending_review",
    reviewedBy: "",
    reviewedAt: null,
    groups: reviewGroups,
    approvedLearnedMappings: [] as Array<{
      accountId: string;
      normalizedDescription: string;
      transactionType: "income" | "expense";
      category: string;
    }>,
  };
  const outputPath = proposalPath.replace(
    /\.json$/i,
    `.${source.runId}.review.json`,
  );
  await writeFile(outputPath, JSON.stringify(reviewTemplate, null, 2), {
    mode: 0o600,
    flag: "wx",
  });
  console.log(
    JSON.stringify({
      proposalRunId: source.runId,
      reviewTemplatePath: outputPath,
      groups: reviewGroups.length,
      pendingGroups: reviewGroups.filter(
        (group) => group.decision === "pending",
      ).length,
      initiallyApprovedGroups: reviewGroups.filter(
        (group) => group.decision === "approved",
      ).length,
      initiallySkippedGroups: reviewGroups.filter(
        (group) => group.decision === "skip",
      ).length,
      writesApplied: false,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Review template creation failed.",
  );
  process.exitCode = 1;
});
