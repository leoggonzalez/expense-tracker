import type {
  CategoryRuleMatchMode,
  Prisma,
  TransactionCategory,
} from "@prisma/client";
import { Prisma as PrismaRuntime } from "@prisma/client";

import { CategoryDefault } from "@/lib/category_default";
import type { CategoryDefaultRule } from "@/lib/category_matching";
import {
  findLearnedCategoryMatch,
  normalizeTransactionDescription,
} from "@/lib/category_matching";
import { prisma } from "@/lib/prisma";

export type CategoryMatchTransactionType = "income" | "expense";

export type CategoryMatchRecord = {
  id: string;
  userAccountId: string;
  normalizedDescription: string;
  matchMode: CategoryRuleMatchMode;
  transactionType: string;
  category: TransactionCategory;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryMatchPatch = {
  ownerId: string;
  rulesVersion: number;
  match: Pick<
    CategoryMatchRecord,
    "normalizedDescription" | "transactionType" | "category"
  >;
};

/** Owns account-scoped matching and atomic learning. Exact manual choices override personal phrases and shared defaults. */
export class CategoryMatch {
  private static getMatchKey(
    normalizedDescription: string,
    transactionType: CategoryMatchTransactionType,
  ): string {
    return JSON.stringify([normalizedDescription, transactionType]);
  }

  /** Normalize exact and phrase keys consistently with the browser resolver. */
  public static normalizeDescription(description: string): string {
    return normalizeTransactionDescription(description);
  }

  /** Find an applicable personal match for saving; restricts both ownership and transaction type. */
  public static async findApplicable(
    tx: Prisma.TransactionClient,
    userAccountId: string,
    description: string,
    transactionType: CategoryMatchTransactionType,
  ): Promise<CategoryMatchRecord | null> {
    const matches = await tx.categoryMatch.findMany({
      where: {
        userAccountId,
        transactionType,
        OR: [
          {
            normalizedDescription:
              CategoryMatch.normalizeDescription(description),
            matchMode: "exact",
          },
          { matchMode: "phrase" },
        ],
      },
    });
    return (
      findLearnedCategoryMatch(description, transactionType, matches) ?? null
    );
  }

  /** Load personal knowledge once per bulk request, resolving each description in memory. */
  public static async findApplicableMany(
    userAccountId: string,
    descriptions: Array<{
      description: string;
      transactionType: CategoryMatchTransactionType;
    }>,
  ): Promise<Map<string, CategoryMatchRecord>> {
    if (!descriptions.length) return new Map();
    const matches = await prisma.categoryMatch.findMany({
      where: { userAccountId },
    });
    const resolved = new Map<string, CategoryMatchRecord>();
    for (const item of descriptions) {
      const match = findLearnedCategoryMatch(
        item.description,
        item.transactionType,
        matches,
      );
      if (match)
        resolved.set(
          CategoryMatch.getKey(item.description, item.transactionType),
          match,
        );
    }
    return resolved;
  }

  /** Stable in-memory key for bulk description/type lookup. */
  public static getKey(
    description: string,
    transactionType: CategoryMatchTransactionType,
  ): string {
    return CategoryMatch.getMatchKey(
      CategoryMatch.normalizeDescription(description),
      transactionType,
    );
  }

  /** Read personal matches, account version, and shared defaults from one repeatable snapshot. */
  public static async listForUser(userAccountId: string): Promise<{
    rulesVersion: number;
    matches: CategoryMatchRecord[];
    defaults: CategoryDefaultRule[];
    defaultsVersion: string;
  }> {
    const { account, matches, defaults } = await prisma.$transaction(
      async (tx) => {
        const [account, matches, defaults] = await Promise.all([
          tx.userAccount.findUnique({
            where: { id: userAccountId },
            select: { categoryRulesVersion: true },
          }),
          tx.categoryMatch.findMany({
            where: { userAccountId },
            orderBy: { normalizedDescription: "asc" },
          }),
          CategoryDefault.listActive(tx),
        ]);
        return { account, matches, defaults };
      },
      {
        isolationLevel: PrismaRuntime.TransactionIsolationLevel.RepeatableRead,
      },
    );

    if (!account) throw new Error("user_account_not_found");
    return {
      rulesVersion: account.categoryRulesVersion,
      matches,
      defaults,
      defaultsVersion: CategoryDefault.version(defaults),
    };
  }

  /** Upsert an exact manual choice and increment the account version only on change, within the caller’s transaction. Empty descriptions do not teach. */
  public static async learnExplicitChoice(
    tx: Prisma.TransactionClient,
    input: {
      userAccountId: string;
      description: string;
      transactionType: CategoryMatchTransactionType;
      category: TransactionCategory;
    },
  ): Promise<{
    match: CategoryMatchRecord | null;
    rulesVersion: number;
    changed: boolean;
  }> {
    const normalizedDescription = CategoryMatch.normalizeDescription(
      input.description,
    );
    if (!normalizedDescription) {
      const account = await tx.userAccount.findUniqueOrThrow({
        where: { id: input.userAccountId },
        select: { categoryRulesVersion: true },
      });
      return {
        match: null,
        rulesVersion: account.categoryRulesVersion,
        changed: false,
      };
    }

    const matchId = crypto.randomUUID();
    const changedMatches = await tx.$queryRaw<CategoryMatchRecord[]>`
      INSERT INTO "CategoryMatch" (
        "id", "userAccountId", "normalizedDescription", "transactionType",
        "category", "matchMode", "createdAt", "updatedAt"
      ) VALUES (
        ${matchId}, ${input.userAccountId}, ${normalizedDescription},
        ${input.transactionType}, ${input.category}::"TransactionCategory", 'exact',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("userAccountId", "normalizedDescription", "transactionType", "matchMode")
      DO UPDATE SET
        "category" = EXCLUDED."category",
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "CategoryMatch"."category" IS DISTINCT FROM EXCLUDED."category"
      RETURNING "id", "userAccountId", "normalizedDescription", "transactionType",
        "category", "matchMode", "createdAt", "updatedAt"
    `;

    if (!changedMatches.length) {
      const [match, account] = await Promise.all([
        tx.categoryMatch.findUnique({
          where: {
            userAccountId_normalizedDescription_transactionType_matchMode: {
              userAccountId: input.userAccountId,
              normalizedDescription,
              transactionType: input.transactionType,
              matchMode: "exact",
            },
          },
        }),
        tx.userAccount.findUniqueOrThrow({
          where: { id: input.userAccountId },
          select: { categoryRulesVersion: true },
        }),
      ]);
      return {
        match,
        rulesVersion: account.categoryRulesVersion,
        changed: false,
      };
    }

    const account = await tx.userAccount.update({
      where: { id: input.userAccountId },
      data: { categoryRulesVersion: { increment: 1 } },
      select: { categoryRulesVersion: true },
    });

    return {
      match: changedMatches[0],
      rulesVersion: account.categoryRulesVersion,
      changed: true,
    };
  }
}
