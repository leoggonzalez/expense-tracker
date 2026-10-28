import type {
  CategoryRuleMatchMode,
  TransactionCategory,
} from "@prisma/client";

export const CATEGORY_NORMALIZATION_VERSION = 1;
/** Resolver algorithm version for historical artifacts; rule content is fingerprinted separately. */
export const CATEGORY_MATCHING_VERSION = 8;

export interface LearnedCategoryMatch {
  normalizedDescription: string;
  transactionType: string;
  category: TransactionCategory;
  matchMode?: CategoryRuleMatchMode;
}

/** Serializable active shared rule; priority is ascending, then stable identity. */
export interface CategoryDefaultRule {
  id: string;
  pattern: string;
  transactionType: string;
  matchMode: CategoryRuleMatchMode;
  category: TransactionCategory;
  priority: number;
}

export interface CategoryResolution {
  category: TransactionCategory;
  source: "learned" | "rule" | "fallback";
}

export function normalizeTransactionDescription(description: string): string {
  return description
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function includesPhrase(description: string, phrase: string): boolean {
  if (!phrase) return false;
  const escapedPhrase = phrase
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapedPhrase}($|[^\\p{L}\\p{N}])`,
    "u",
  ).test(description);
}

function matchesPattern(
  description: string,
  pattern: string,
  mode: CategoryRuleMatchMode,
): boolean {
  const normalizedPattern = normalizeTransactionDescription(pattern);
  if (mode === "all") return true;
  return mode === "exact"
    ? description === normalizedPattern
    : includesPhrase(description, normalizedPattern);
}

/** Exact personal corrections win over personal phrases; longer phrases win ties. Never mixes transaction types. */
export function findLearnedCategoryMatch<T extends LearnedCategoryMatch>(
  description: string,
  transactionType: "income" | "expense",
  learnedMatches: readonly T[],
): T | undefined {
  const normalized = normalizeTransactionDescription(description);
  return learnedMatches
    .filter(
      (match) =>
        match.transactionType === transactionType &&
        matchesPattern(
          normalized,
          match.normalizedDescription,
          match.matchMode ?? "exact",
        ),
    )
    .sort((left, right) => {
      const exactOrder =
        Number((right.matchMode ?? "exact") === "exact") -
        Number((left.matchMode ?? "exact") === "exact");
      return (
        exactOrder ||
        right.normalizedDescription.length -
          left.normalizedDescription.length ||
        left.normalizedDescription.localeCompare(right.normalizedDescription)
      );
    })[0];
}

/** Pure browser/server resolver. All matching data is supplied by the database snapshot; missing data falls back safely. */
export function resolveTransactionCategory(
  description: string,
  transactionType: "income" | "expense",
  learnedMatches: readonly LearnedCategoryMatch[] = [],
  defaults: readonly CategoryDefaultRule[] = [],
): CategoryResolution {
  const personalMatch = findLearnedCategoryMatch(
    description,
    transactionType,
    learnedMatches,
  );
  if (personalMatch)
    return { category: personalMatch.category, source: "learned" };
  const normalized = normalizeTransactionDescription(description);
  const rule = defaults
    .filter(
      (candidate) =>
        candidate.transactionType === transactionType &&
        matchesPattern(normalized, candidate.pattern, candidate.matchMode),
    )
    .sort(
      (left, right) =>
        left.priority - right.priority || left.id.localeCompare(right.id),
    )[0];
  return rule
    ? { category: rule.category, source: "rule" }
    : { category: "uncategorized", source: "fallback" };
}
