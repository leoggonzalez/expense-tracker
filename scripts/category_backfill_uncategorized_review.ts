import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { transactionCategoryKeys } from "@/lib/category_catalog";

import {
  CategoryBackfillProposal,
  CategoryBackfillReview,
} from "./category_backfill_models";

/** Escape transaction text so merchant descriptions cannot introduce extra table cells or lines. */
function toMarkdownCell(value: string): string {
  return value
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .replaceAll("\r", " ")
    .trim();
}

/** Display the date portion of the saved ISO timestamp without timezone conversion. */
function displayDate(value: string): string {
  return value.slice(0, 10);
}

/** Export unresolved snapshots for manual review, preserving identifiers and expected record versions. */
async function main(): Promise<void> {
  const proposalPath = process.argv[2];
  const reviewPath = process.argv[3];
  if (!proposalPath || !reviewPath) {
    throw new Error(
      "Usage: yarn category:backfill:uncategorized-review <proposal-report.json> <review.json>",
    );
  }
  const proposalModel = await CategoryBackfillProposal.read(proposalPath);
  const reviewModel = await CategoryBackfillReview.read(
    reviewPath,
    proposalModel,
  );
  const proposal = proposalModel.data;
  const assignments = reviewModel
    .unresolvedAssignments()
    .sort((left, right) => {
      const groupOrder =
        left.normalizedDescription.localeCompare(right.normalizedDescription) ||
        left.transactionType.localeCompare(right.transactionType);
      return (
        groupOrder || left.transactionId.localeCompare(right.transactionId)
      );
    });

  const groups = proposalModel.groupAssignments(assignments);

  const lines = [
    "# Uncategorized transaction review",
    "",
    `Proposal run: \`${proposal.runId}\`  `,
    `Target database: \`${proposal.targetDatabase.host}/${proposal.targetDatabase.database}\`  `,
    `Schema: \`${proposal.targetDatabase.schemaVersion}\`  `,
    `Unresolved non-transfer transactions: **${assignments.length}**  `,
    "Status: pending manual review; this file has not changed the database.",
    "",
    "## How to fill this file",
    "",
    "Enter one stable category key in the **Category to apply** column for each transaction. Use `uncategorized` when it should stay uncategorized. Leave IDs, descriptions, account, type, and `updatedAt` unchanged so the later apply step can detect records that changed after review.",
    "",
    `Allowed keys: ${transactionCategoryKeys.map((key) => "`" + key + "`").join(", ")}.`,
    "",
  ];

  let rowNumber = 0;
  for (const group of groups.values()) {
    const first = group[0];
    lines.push(
      `## ${toMarkdownCell(first.normalizedDescription)} — ${first.transactionType} (${group.length})`,
      "",
      `Account: \`${first.accountId}\`  `,
      `Space: ${toMarkdownCell(first.spaceName)}${first.isArchivedSpace ? " (archived)" : ""}`,
      "",
      "| # | Description | Type | Amount | Date | Current category / source | Category to apply | Transaction ID | Expected updatedAt |",
      "| ---: | --- | --- | ---: | --- | --- | --- | --- | --- |",
    );
    for (const assignment of group) {
      rowNumber += 1;
      const category =
        first.normalizedDescription === "total february" ? "uncategorized" : "";
      lines.push(
        `| ${rowNumber} | ${toMarkdownCell(assignment.description)} | ${toMarkdownCell(assignment.transactionType)} | ${assignment.amount.toFixed(2)} | ${displayDate(assignment.beginDate)} | ${toMarkdownCell(assignment.currentCategory)} / ${toMarkdownCell(assignment.currentSource)} | ${category} | \`${assignment.transactionId}\` | \`${assignment.updatedAt}\` |`,
      );
    }
    lines.push("");
  }

  const outputPath = join(
    "/private/tmp",
    `currento-uncategorized-transactions-${proposal.runId}.md`,
  );
  await writeFile(outputPath, `${lines.join("\n")}\n`, {
    mode: 0o600,
    flag: "wx",
  });
  console.log(
    JSON.stringify({
      outputPath,
      rows: assignments.length,
      groups: groups.size,
      writesApplied: false,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Uncategorized review file generation failed.",
  );
  process.exitCode = 1;
});
