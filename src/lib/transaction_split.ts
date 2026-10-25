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
