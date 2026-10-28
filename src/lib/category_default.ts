import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

import type { CategoryDefaultRule } from "@/lib/category_matching";
import { prisma } from "@/lib/prisma";

/** Owns shared category-default reads. Personal corrections are stored separately and never modify this table. */
export class CategoryDefault {
  /** Load active rules in deterministic priority order. Accepts a transaction for consistent bootstrap/save snapshots. */
  public static async listActive(
    tx: Pick<Prisma.TransactionClient, "categoryDefault"> = prisma,
  ): Promise<CategoryDefaultRule[]> {
    return tx.categoryDefault.findMany({
      where: { enabled: true },
      orderBy: [{ priority: "asc" }, { id: "asc" }],
      select: {
        id: true,
        pattern: true,
        transactionType: true,
        matchMode: true,
        category: true,
        priority: true,
      },
    });
  }

  /** Content fingerprint changes on insert, edit, disabling, or deletion, including direct database edits. */
  public static version(rules: readonly CategoryDefaultRule[]): string {
    return createHash("sha256").update(JSON.stringify(rules)).digest("hex");
  }
}
