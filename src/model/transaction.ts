import { endOfMonth, startOfMonth } from "date-fns";

export interface ITransaction {
  id: string;
  type: "income" | "expense";
  space: string;
  spaceName: string;
  description: string;
  amount: number;
  beginDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type TransactionJSON = {
  id: string;
  type: string;
  space?: string;
  spaceName?: string;
  description: string;
  amount: number;
  beginDate: Date | string;
  endDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export class Transaction {
  private data: ITransaction;

  constructor(data: ITransaction) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get type(): "income" | "expense" {
    return this.data.type;
  }

  get space(): string {
    return this.data.space;
  }

  get spaceName(): string {
    return this.data.spaceName;
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
   * Check if this transaction is active for a given month
   */
  isActiveInMonth(targetDate: Date): boolean {
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // Transaction starts before or during this month
    const startsBeforeOrDuringMonth = this.beginDate <= monthEnd;

    // Transaction hasn't ended or ends during or after this month
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
   * Check if transaction is an income
   */
  isIncome(): boolean {
    return this.type === "income";
  }

  /**
   * Check if transaction is an expense
   */
  isExpense(): boolean {
    return this.type === "expense";
  }

  /**
   * Convert to plain object
   */
  toJSON(): ITransaction {
    return { ...this.data };
  }

  /**
   * Create Transaction instance from plain object
   */
  static fromJSON(data: TransactionJSON): Transaction {
    return new Transaction({
      ...data,
      type: data.type as ITransaction["type"],
      space: data.space ?? data.spaceName ?? "",
      spaceName: data.spaceName ?? data.space ?? "",
      beginDate: new Date(data.beginDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}
