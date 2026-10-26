import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizeTransactionAmount } from "@/lib/amount";
import {
  getSplitShareCents,
  getParticipantGroupMonthTotals,
  parseSplitParticipants,
} from "@/lib/transaction_split";
import type {
  MemberInput,
  MemberMonthTotal,
  ParticipantGroupMonthTotal,
  SplitMember,
} from "@/lib/transaction_split";

export class SpaceMember {
  public static async listForSpaces(
    userAccountId: string,
    spaceIds: string[],
  ): Promise<Record<string, SplitMember[]>> {
    const members = await prisma.spaceMember.findMany({
      where: { spaceId: { in: spaceIds }, space: { userAccountId } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    const result: Record<string, SplitMember[]> = {};
    for (const member of members) {
      (result[member.spaceId] ||= []).push({
        id: member.id,
        name: member.name,
        isRemoved: member.removedAt !== null,
      });
    }
    return result;
  }

  public static async sync(
    tx: Prisma.TransactionClient,
    spaceId: string,
    inputs: MemberInput[],
  ): Promise<void> {
    if (
      !Array.isArray(inputs) ||
      inputs.length > 100 ||
      inputs.some(
        (member) =>
          !member ||
          typeof member.name !== "string" ||
          !member.name.trim() ||
          member.name.trim().length > 100,
      )
    )
      throw new Error("spaces_page.invalid_members");
    const existing = await tx.spaceMember.findMany({
      where: { spaceId, removedAt: null },
    });
    const ids = inputs.flatMap((member) => (member.id ? [member.id] : []));
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !existing.some((member) => member.id === id))
    ) {
      throw new Error("spaces_page.invalid_members");
    }
    for (const input of inputs) {
      const name = input.name.trim();
      if (!input.id) {
        await tx.spaceMember.create({ data: { spaceId, name } });
      } else if (
        existing.find((member) => member.id === input.id)?.name !== name
      ) {
        await tx.spaceMember.update({
          where: { id: input.id },
          data: { name },
        });
      }
    }
    const removed = existing.filter((member) => !ids.includes(member.id));
    if (removed.length) {
      // Retain identities referenced by historical splits; never redistribute them.
      await tx.spaceMember.updateMany({
        where: { id: { in: removed.map((member) => member.id) } },
        data: { removedAt: new Date() },
      });
    }
  }

  public static async serializeParticipants(
    tx: Prisma.TransactionClient,
    userAccountId: string,
    spaceId: string,
    participantIds: string[] | undefined,
    previous: string | null = null,
  ): Promise<string> {
    const spaces = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Space" WHERE id = ${spaceId} AND "userAccountId" = ${userAccountId}
      AND NOT "isArchived" FOR UPDATE
    `;
    if (!spaces.length) throw new Error("space_not_found");
    const selected = participantIds ?? [userAccountId];
    if (
      !Array.isArray(selected) ||
      !selected.length ||
      selected.some((id) => typeof id !== "string" || id.includes(";"))
    ) {
      throw new Error("transaction_split.invalid_split");
    }
    const members = await tx.spaceMember.findMany({ where: { spaceId } });
    const previousIds = parseSplitParticipants(previous);
    const allowed = new Set([
      userAccountId,
      ...members
        .filter(
          (member) => !member.removedAt || previousIds.includes(member.id),
        )
        .map((member) => member.id),
    ]);
    if (selected.some((id) => !allowed.has(id)))
      throw new Error("transaction_split.invalid_split");
    return [...new Set(selected)].sort().join(";");
  }

  public static async getMonthTotalsForSpaces(
    userAccountId: string,
    spaceIds: string[],
    monthStart: Date,
    monthEnd: Date,
  ): Promise<Record<string, MemberMonthTotal[]>> {
    if (!spaceIds.length) return {};
    const members = await SpaceMember.listForSpaces(userAccountId, spaceIds);
    const occurrences = await SpaceMember.listMonthOccurrences(
      userAccountId,
      spaceIds,
      monthStart,
      monthEnd,
    );
    const totals = new Map<string, Map<string, number>>();
    for (const occurrence of occurrences) {
      const ids = parseSplitParticipants(occurrence.splitParticipantIds);
      if (!ids.length) ids.push(userAccountId);
      const share = getSplitShareCents(
        normalizeTransactionAmount(occurrence.type, occurrence.amount),
        ids.length,
      );
      const spaceTotals =
        totals.get(occurrence.spaceId) || new Map<string, number>();
      for (const id of ids)
        spaceTotals.set(id, (spaceTotals.get(id) || 0) + share);
      totals.set(occurrence.spaceId, spaceTotals);
    }
    const result: Record<string, MemberMonthTotal[]> = {};
    for (const spaceId of spaceIds) {
      const spaceTotals = totals.get(spaceId);
      const visible = (members[spaceId] || []).filter(
        (member) => !member.isRemoved || spaceTotals?.has(member.id),
      );
      result[spaceId] = visible.length
        ? [
            {
              id: userAccountId,
              name: "",
              isOwner: true,
              isRemoved: false,
              amount: (spaceTotals?.get(userAccountId) || 0) / 100,
            },
            ...visible.map((member) => ({
              ...member,
              isOwner: false,
              amount: (spaceTotals?.get(member.id) || 0) / 100,
            })),
          ]
        : [];
    }
    return result;
  }

  public static async getMonthGroupTotalsForSpace(
    userAccountId: string,
    spaceId: string,
    monthStart: Date,
    monthEnd: Date,
    owner: SplitMember,
    members: SplitMember[],
  ): Promise<ParticipantGroupMonthTotal[]> {
    const totals = await SpaceMember.getMonthGroupTotalsForSpaces(
      userAccountId,
      [spaceId],
      monthStart,
      monthEnd,
      owner,
      { [spaceId]: members },
    );
    return totals[spaceId] || [];
  }

  public static async getMonthGroupTotalsForSpaces(
    userAccountId: string,
    spaceIds: string[],
    monthStart: Date,
    monthEnd: Date,
    owner: SplitMember,
    members: Record<string, SplitMember[]>,
  ): Promise<Record<string, ParticipantGroupMonthTotal[]>> {
    if (!spaceIds.length) return {};
    const occurrences = await SpaceMember.listMonthOccurrences(
      userAccountId,
      spaceIds,
      monthStart,
      monthEnd,
      true,
    );
    const bySpace = new Map<string, typeof occurrences>();
    for (const occurrence of occurrences) {
      const rows = bySpace.get(occurrence.spaceId) || [];
      rows.push(occurrence);
      bySpace.set(occurrence.spaceId, rows);
    }
    return Object.fromEntries(
      spaceIds.map((spaceId) => [
        spaceId,
        getParticipantGroupMonthTotals(
          bySpace.get(spaceId) || [],
          owner,
          members[spaceId] || [],
        ),
      ]),
    );
  }

  private static async listMonthOccurrences(
    userAccountId: string,
    spaceIds: string[],
    monthStart: Date,
    monthEnd: Date,
    includeTransfers = false,
  ) {
    // Use the same occurrences and credit-card month mapping as projection totals.
    return await prisma.$queryRaw<
      Array<{
        spaceId: string;
        type: string;
        amount: number;
        splitParticipantIds: string | null;
        transferSpaceId: string | null;
      }>
    >`
      SELECT t."spaceId", t.type, t.amount, t."splitParticipantIds", t."transferSpaceId"
      FROM "Transaction" t INNER JOIN "Space" s ON s.id = t."spaceId"
      CROSS JOIN LATERAL generate_series(
        date_trunc('month', t."beginDate"),
        date_trunc('month', COALESCE(t."endDate", ${monthEnd})), interval '1 month'
      ) AS occurrence_month(month_start)
      WHERE s."userAccountId" = ${userAccountId} AND s.id IN (${Prisma.join(spaceIds)})
        AND (${includeTransfers} OR t."transferSpaceId" IS NULL) AND t."beginDate" <= ${monthEnd}
        AND "getSpaceProjectionMonthStart"(s.type::text, s."paymentDueDay", s."periodEndDay",
          (occurrence_month.month_start + make_interval(days => LEAST(
            EXTRACT(DAY FROM t."beginDate")::integer,
            EXTRACT(DAY FROM occurrence_month.month_start + interval '1 month - 1 day')::integer
          ) - 1))::timestamp) = ${monthStart}
    `;
  }
}
