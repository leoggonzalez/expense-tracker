import "dotenv/config";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

import {
  CATEGORY_NORMALIZATION_VERSION,
  CATEGORY_MATCHING_VERSION,
  normalizeTransactionDescription,
  resolveTransactionCategory,
} from "@/lib/category_matching";

import { CategoryDefault } from "@/lib/category_default";

import {
  CategoryBackfillProposal,
  type CategoryBackfillAssignment,
  type CategoryBackfillGroup,
} from "./category_backfill_models";

const schemaVersion = "20261027150000_database_category_defaults";
const expectedDatabase = "expense_tracker";
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

/** Reads the approved local database and produces review artifacts without mutating business data. */
class CategoryBackfillProposalGenerator {
  private readonly prisma = new PrismaClient();

  /** Reject unexpected hosts, database names, or disagreement between runtime and direct URLs. */
  private assertLocalTarget(): URL {
    const databaseUrls = [
      process.env.DATABASE_URL,
      process.env.DIRECT_URL,
    ].filter((value): value is string => Boolean(value));
    if (!databaseUrls.length || !process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required.");
    }
    const urls = databaseUrls.map((value) => new URL(value));
    for (const url of urls) {
      const databaseName = decodeURIComponent(url.pathname.slice(1));
      if (!localHosts.has(url.hostname) || databaseName !== expectedDatabase) {
        throw new Error(
          `Refusing non-local database target; expected localhost/${expectedDatabase}.`,
        );
      }
    }
    const [runtimeUrl, directUrl] = urls;
    if (
      directUrl &&
      (runtimeUrl.hostname !== directUrl.hostname ||
        runtimeUrl.port !== directUrl.port ||
        runtimeUrl.pathname !== directUrl.pathname)
    ) {
      throw new Error(
        "DATABASE_URL and DIRECT_URL must identify the same local database.",
      );
    }
    return runtimeUrl;
  }

  /**
   * Validate the local target, classify its rows, and save a versioned proposal report.
   * @returns Resolves after writing a new private report file and printing its summary.
   * @throws If the database is unexpected, its migration is missing, or reading/writing fails.
   */
  public async run(): Promise<void> {
    const targetUrl = this.assertLocalTarget();
    const target = await this.prisma.$queryRaw<
      Array<{ databaseName: string; serverAddress: string | null }>
    >`SELECT current_database() AS "databaseName", inet_server_addr()::text AS "serverAddress"`;
    const databaseIdentity = target[0];
    if (
      databaseIdentity?.databaseName !== expectedDatabase ||
      (databaseIdentity.serverAddress !== null &&
        !localHosts.has(databaseIdentity.serverAddress.split("/")[0]))
    ) {
      throw new Error(
        "Connected database identity is not the approved local target.",
      );
    }

    const migration = await this.prisma.$queryRaw<
      Array<{ finishedAt: Date | null }>
    >`
    SELECT finished_at AS "finishedAt"
    FROM "_prisma_migrations"
    WHERE migration_name = ${schemaVersion}
      AND finished_at IS NOT NULL
      AND rolled_back_at IS NULL
    ORDER BY finished_at DESC
    LIMIT 1
  `;
    if (!migration.length) {
      throw new Error(
        "The category schema migration is not applied to the local target.",
      );
    }

    const snapshot = await this.readSnapshot();
    const accounts = snapshot[2];
    const assignments = this.buildAssignments(snapshot);
    const groupedProposals = this.summarizeAssignments(assignments);

    const report = {
      runId: randomUUID(),
      generatedAt: new Date().toISOString(),
      targetDatabase: {
        host: targetUrl.hostname,
        database: databaseIdentity.databaseName,
        schemaVersion,
      },
      normalizationVersion: CATEGORY_NORMALIZATION_VERSION,
      rulesVersion: CATEGORY_MATCHING_VERSION,
      defaultsVersion: CategoryDefault.version(snapshot[3]),
      accountRulesVersions: Object.fromEntries(
        accounts.map((account) => [account.id, account.categoryRulesVersion]),
      ),
      reviewStatus: "pending_review",
      dryRun: true,
      transactionCount: assignments.length,
      groupCount: groupedProposals.length,
      unresolvedCount: assignments.filter((item) => item.unresolved).length,
      internalTransferCount: assignments.filter((item) => item.internalTransfer)
        .length,
      assignments,
      groupedProposals,
    };
    const reportWithChecksum = CategoryBackfillProposal.create(report).data;
    const checksum = reportWithChecksum.checksum;
    const outputFolder = "/private/tmp";
    await mkdir(outputFolder, { recursive: true });
    const outputPath = join(
      outputFolder,
      `currento-category-proposals-${report.generatedAt.replace(/[:.]/g, "-")}.json`,
    );
    await writeFile(outputPath, JSON.stringify(reportWithChecksum, null, 2), {
      mode: 0o600,
      flag: "wx",
    });
    console.log(
      JSON.stringify({
        outputPath,
        checksum,
        transactionCount: report.transactionCount,
        groupCount: report.groupCount,
        unresolvedCount: report.unresolvedCount,
        internalTransferCount: report.internalTransferCount,
        reviewStatus: report.reviewStatus,
        writesApplied: false,
      }),
    );
  }

  /** Load only classification inputs, keeping the original database ordering and selected fields. */
  private async readSnapshot() {
    return Promise.all([
      this.prisma.transaction.findMany({
        select: {
          id: true,
          type: true,
          description: true,
          amount: true,
          beginDate: true,
          endDate: true,
          updatedAt: true,
          category: true,
          categorySource: true,
          transferSpaceId: true,
          space: {
            select: {
              id: true,
              name: true,
              isArchived: true,
              userAccountId: true,
            },
          },
        },
        orderBy: [
          { space: { userAccountId: "asc" } },
          { description: "asc" },
          { id: "asc" },
        ],
      }),
      this.prisma.categoryMatch.findMany({
        select: {
          userAccountId: true,
          normalizedDescription: true,
          matchMode: true,
          transactionType: true,
          category: true,
        },
      }),
      this.prisma.userAccount.findMany({
        select: { id: true, categoryRulesVersion: true },
      }),
      CategoryDefault.listActive(this.prisma),
    ]);
  }

  /** Resolve each row within its account, preserving manual choices and excluding transfers. */
  private buildAssignments([transactions, learnedMatches, , defaults]: Awaited<
    ReturnType<CategoryBackfillProposalGenerator["readSnapshot"]>
  >): CategoryBackfillAssignment[] {
    const learnedByAccount = new Map<string, typeof learnedMatches>();
    for (const match of learnedMatches) {
      const entries = learnedByAccount.get(match.userAccountId) ?? [];
      entries.push(match);
      learnedByAccount.set(match.userAccountId, entries);
    }

    return transactions.map((transaction) => {
      const normalizedDescription = normalizeTransactionDescription(
        transaction.description,
      );
      const learned =
        learnedByAccount.get(transaction.space.userAccountId) ?? [];
      const currentLearnedMatch = learned.find(
        (match) =>
          match.normalizedDescription === normalizedDescription &&
          match.transactionType === transaction.type,
      );
      const internalTransfer = transaction.transferSpaceId !== null;
      const manual = transaction.categorySource === "manual";
      const validType =
        transaction.type === "income" || transaction.type === "expense";

      if (internalTransfer) {
        return {
          transactionId: transaction.id,
          accountId: transaction.space.userAccountId,
          spaceId: transaction.space.id,
          spaceName: transaction.space.name,
          isArchivedSpace: transaction.space.isArchived,
          description: transaction.description,
          normalizedDescription,
          transactionType: transaction.type,
          updatedAt: transaction.updatedAt.toISOString(),
          currentCategory: transaction.category,
          currentSource: transaction.categorySource,
          currentLearnedCategory: currentLearnedMatch?.category ?? null,
          proposedCategory: null,
          proposedSource: null,
          reason: "internal_transfer_excluded",
          confidence: 1,
          unresolved: false,
          internalTransfer: true,
          amount: transaction.amount,
          beginDate: transaction.beginDate.toISOString(),
          endDate: transaction.endDate?.toISOString() ?? null,
        };
      }

      if (manual) {
        return {
          transactionId: transaction.id,
          accountId: transaction.space.userAccountId,
          spaceId: transaction.space.id,
          spaceName: transaction.space.name,
          isArchivedSpace: transaction.space.isArchived,
          description: transaction.description,
          normalizedDescription,
          transactionType: transaction.type,
          updatedAt: transaction.updatedAt.toISOString(),
          currentCategory: transaction.category,
          currentSource: transaction.categorySource,
          currentLearnedCategory: currentLearnedMatch?.category ?? null,
          proposedCategory: transaction.category,
          proposedSource: "manual",
          reason: "manual_assignment_protected",
          confidence: 1,
          unresolved: false,
          internalTransfer: false,
          amount: transaction.amount,
          beginDate: transaction.beginDate.toISOString(),
          endDate: transaction.endDate?.toISOString() ?? null,
        };
      }

      const resolution = validType
        ? resolveTransactionCategory(
            transaction.description,
            transaction.type as "income" | "expense",
            learned.map((match) => ({
              normalizedDescription: match.normalizedDescription,
              transactionType: match.transactionType as "income" | "expense",
              category: match.category,
              matchMode: match.matchMode,
            })),
            defaults,
          )
        : { category: "uncategorized" as const, source: "fallback" as const };
      const unresolved = resolution.source === "fallback" || !validType;

      return {
        transactionId: transaction.id,
        accountId: transaction.space.userAccountId,
        spaceId: transaction.space.id,
        spaceName: transaction.space.name,
        isArchivedSpace: transaction.space.isArchived,
        description: transaction.description,
        normalizedDescription,
        transactionType: transaction.type,
        updatedAt: transaction.updatedAt.toISOString(),
        currentCategory: transaction.category,
        currentSource: transaction.categorySource,
        currentLearnedCategory: currentLearnedMatch?.category ?? null,
        proposedCategory: unresolved ? null : resolution.category,
        proposedSource: unresolved ? null : resolution.source,
        reason: !validType
          ? "unsupported_transaction_type"
          : resolution.source === "learned"
            ? "account_learned_match"
            : resolution.source === "rule"
              ? "built_in_rule"
              : "no_confident_match",
        confidence: unresolved ? 0 : resolution.source === "learned" ? 1 : 0.85,
        unresolved,
        internalTransfer: false,
        amount: transaction.amount,
        beginDate: transaction.beginDate.toISOString(),
        endDate: transaction.endDate?.toISOString() ?? null,
      };
    });
  }

  /** Summarize each description group, retaining ambiguity flags, representative rows, and review ranges. */
  private summarizeAssignments(
    assignments: CategoryBackfillAssignment[],
  ): CategoryBackfillGroup[] {
    const groups = new Map<
      string,
      {
        accountId: string;
        normalizedDescription: string;
        transactionType: string;
        assignments: CategoryBackfillAssignment[];
      }
    >();
    for (const assignment of assignments) {
      const key = JSON.stringify([
        assignment.accountId,
        assignment.normalizedDescription,
        assignment.transactionType,
      ]);
      const group = groups.get(key) ?? {
        accountId: assignment.accountId,
        normalizedDescription: assignment.normalizedDescription,
        transactionType: assignment.transactionType,
        assignments: [],
      };
      group.assignments.push(assignment);
      groups.set(key, group);
    }

    return [...groups.values()].map((group) => {
      const descriptionVariants = new Map<string, number>();
      const categoryCounts = new Map<string, number>();
      const proposedCategories = new Set<string>();
      const reasons = new Set<string>();
      for (const assignment of group.assignments) {
        descriptionVariants.set(
          assignment.description,
          (descriptionVariants.get(assignment.description) ?? 0) + 1,
        );
        categoryCounts.set(
          assignment.currentCategory,
          (categoryCounts.get(assignment.currentCategory) ?? 0) + 1,
        );
        if (assignment.proposedCategory) {
          proposedCategories.add(assignment.proposedCategory);
        }
        reasons.add(assignment.reason);
      }
      const dates = group.assignments
        .map((assignment) => assignment.beginDate)
        .sort();
      const amounts = group.assignments.map((assignment) =>
        Math.abs(assignment.amount),
      );
      const unresolvedCount = group.assignments.filter(
        (item) => item.unresolved,
      ).length;
      const ambiguous = proposedCategories.size > 1 || categoryCounts.size > 1;
      return {
        accountId: group.accountId,
        normalizedDescription: group.normalizedDescription,
        transactionType: group.transactionType,
        transactionCount: group.assignments.length,
        originalDescriptionVariants: [...descriptionVariants.entries()].map(
          ([description, count]) => ({ description, count }),
        ),
        currentCategoryCounts: [...categoryCounts.entries()].map(
          ([category, count]) => ({ category, count }),
        ),
        proposedCategories: [...proposedCategories],
        reasons: [...reasons],
        unresolvedCount,
        ambiguous,
        needsReview: unresolvedCount > 0 || ambiguous,
        transactionIds: group.assignments.map((item) => item.transactionId),
        amountRange: {
          minimum: amounts.length ? Math.min(...amounts) : 0,
          maximum: amounts.length ? Math.max(...amounts) : 0,
        },
        dateRange: { earliest: dates[0] ?? null, latest: dates.at(-1) ?? null },
        representatives: group.assignments.slice(0, 5),
      };
    });
  }

  /**
   * Release the database connection, including after validation or report writing fails.
   * @returns Resolves after Prisma disconnects from the local database.
   */
  public async dispose(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

const generator = new CategoryBackfillProposalGenerator();
generator
  .run()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Category proposal generation failed.",
    );
    process.exitCode = 1;
  })
  .finally(() => generator.dispose());
