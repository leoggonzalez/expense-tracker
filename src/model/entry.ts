import { endOfMonth, startOfMonth } from "date-fns";

export interface IEntry {
  id: string;
  type: "income" | "expense";
  account: string;
  accountName: string;
  description: string;
  amount: number;
  beginDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type EntryJSON = {
  id: string;
  type: string;
  account?: string;
  accountName?: string;
  description: string;
  amount: number;
  beginDate: Date | string;
  endDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export class Entry {
  private data: IEntry;

  constructor(data: IEntry) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get type(): "income" | "expense" {
    return this.data.type;
  }

  get account(): string {
    return this.data.account;
  }

  get accountName(): string {
    return this.data.accountName;
  }

  get description(): string {
    return this.data.description;
  }

  get amount(): number {
    if (this.type === "expense" && this.data.amount > 0) {
      return -this.data.amount; // Ensure expenses are negative
    }
    return this.data.amount;
  }

  get beginDate(): Date {
    return this.data.beginDate;
  }

  get endDate(): Date | null {
    return this.data.endDate;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  /**
   * Check if this entry is active for a given month
   */
  isActiveInMonth(targetDate: Date): boolean {
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // Entry starts before or during this month
    const startsBeforeOrDuringMonth = this.beginDate <= monthEnd;

    // Entry hasn't ended or ends during or after this month
    const endsAfterOrDuringMonth = !this.endDate || this.endDate >= monthStart;

    return startsBeforeOrDuringMonth && endsAfterOrDuringMonth;
  }

  /**
   * Get the amount for a specific month (returns 0 if not active)
   */
  getAmountForMonth(targetDate: Date): number {
    return this.isActiveInMonth(targetDate) ? this.amount : 0;
  }

  /**
   * Get formatted amount with currency symbol
   */
  getFormattedAmount(): string {
    const absAmount = Math.abs(this.amount);
    const sign = this.amount < 0 ? "-" : "";
    return `${sign}${absAmount.toFixed(2)} €`;
  }

  /**
   * Check if entry is an income
   */
  isIncome(): boolean {
    return this.type === "income";
  }

  /**
   * Check if entry is an expense
   */
  isExpense(): boolean {
    return this.type === "expense";
  }

  /**
   * Convert to plain object
   */
  toJSON(): IEntry {
    return { ...this.data };
  }

  /**
   * Create Entry instance from plain object
   */
  static fromJSON(data: EntryJSON): Entry {
    return new Entry({
      ...data,
      type: data.type as IEntry["type"],
      account: data.account ?? data.accountName ?? "",
      accountName: data.accountName ?? data.account ?? "",
      beginDate: new Date(data.beginDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}
