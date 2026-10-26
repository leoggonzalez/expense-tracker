import { normalizeTransactionAmount } from "@/lib/amount";

export interface SplitMember {
  id: string;
  name: string;
  isRemoved: boolean;
}

export interface MemberInput {
  id?: string;
  name: string;
}

export interface MemberMonthTotal {
  id: string;
  name: string;
  isOwner: boolean;
  isRemoved: boolean;
  amount: number;
}

export function parseSplitParticipants(
  value: string | null | undefined,
): string[] {
  return [...new Set((value || "").split(";").filter(Boolean))];
}

export function getSplitShareCents(amount: number, count: number): number {
  if (!Number.isFinite(amount) || count < 1) return 0;
  // Shift the decimal before rounding (1.005 must become 101 cents).
  const [significand, exponent = "0"] = Math.abs(amount).toString().split("e");
  const cents = Math.round(Number(`${significand}e${Number(exponent) + 2}`));
  return Math.sign(amount) * Math.round(cents / count);
}

export function getParticipantNames(
  value: string | null | undefined,
  ownerId: string,
  members: SplitMember[],
  ownerName: string,
): string[] {
  const selected = new Set(parseSplitParticipants(value));
  const names = members
    .filter((member) => member.id !== ownerId && selected.has(member.id))
    .map((member) => member.name);
  const includeOwner =
    members.length > 0 && (selected.has(ownerId) || selected.size === 0);
  return includeOwner ? [ownerName, ...names] : names;
}

export function formatParticipantNames(names: string[]): string {
  return new Intl.ListFormat("en-GB", {
    style: "long",
    type: "conjunction",
  }).format(names);
}

export interface ParticipantGroupMonthTotal {
  id: string;
  participants: SplitMember[];
  amount: number;
}

export function getParticipantGroupMonthTotals(
  occurrences: {
    type: string;
    amount: number;
    splitParticipantIds: string | null;
    transferSpaceId?: string | null;
  }[],
  owner: SplitMember,
  members: SplitMember[],
): ParticipantGroupMonthTotal[] {
  const participants = [owner, ...members];
  const groups = new Map<
    string,
    { participants: SplitMember[]; cents: number }
  >();
  for (const occurrence of occurrences) {
    // Transfers have no split; retain them in the owner row to reconcile with the space total.
    const ids = occurrence.transferSpaceId
      ? []
      : parseSplitParticipants(occurrence.splitParticipantIds);
    if (!ids.length) ids.push(owner.id);
    const selected = participants.filter((participant) =>
      ids.includes(participant.id),
    );
    const key = JSON.stringify(
      selected.map((participant) => participant.id).sort(),
    );
    const group = groups.get(key) || { participants: selected, cents: 0 };
    const amount = normalizeTransactionAmount(
      occurrence.type,
      occurrence.amount,
    );
    group.cents += getSplitShareCents(amount, 1);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .map(([id, group]) => ({
      id,
      participants: group.participants,
      amount: group.cents / 100,
    }))
    .sort((a, b) => b.participants.length - a.participants.length);
}
