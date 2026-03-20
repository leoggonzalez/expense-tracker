import { format, startOfMonth } from "date-fns";

import { Transaction } from "@/model/transaction";

export interface MonthlyData {
  month: Date;
  income: number;
  expense: number;
  net: number;
}

export interface SpaceProjectionGroup {
  space: string;
  transactions: Transaction[];
  monthlyTotals: Map<string, number>;
}

export interface SpaceMonthBreakdown {
  space: string;
  income: number;
  expense: number;
  net: number;
}

export class TransactionCollection {
  private transactions: Transaction[];

  constructor(transactions: Transaction[]) {
    this.transactions = transactions;
  }

  /**
   * Get all transactions
   */
  getAll(): Transaction[] {
    return [...this.transactions];
  }

  /**
   * Get transactions filtered by type
   */
  getByType(type: "income" | "expense"): Transaction[] {
    return this.transactions.filter((transaction) => transaction.type === type);
  }

  /**
   * Get transactions active in a specific month
   */
  getActiveInMonth(targetDate: Date): Transaction[] {
    return this.transactions.filter((transaction) => transaction.isActiveInMonth(targetDate));
  }

  /**
   * Get total for a specific month and type
   */
  getTotalForMonth(targetDate: Date, type?: "income" | "expense"): number {
    let filtered = this.getActiveInMonth(targetDate);

    if (type) {
      filtered = filtered.filter((transaction) => transaction.type === type);
    }

    return filtered.reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  /**
   * Get monthly data (income, expense, net) for a date range
   */
  getMonthlyData(startDate: Date, monthCount: number): MonthlyData[] {
    const result: MonthlyData[] = [];

    for (let i = 0; i < monthCount; i++) {
      const month = new Date(startDate);
      month.setMonth(startDate.getMonth() + i);
      const monthStart = startOfMonth(month);

      const income = this.getTotalForMonth(monthStart, "income");
      const expense = this.getTotalForMonth(monthStart, "expense");

      result.push({
        month: monthStart,
        income,
        expense,
        net: income + expense, // expense is already negative
      });
    }

    return result;
  }

  /**
   * Get all unique spaces
   */
  getSpaces(): string[] {
    const spaces = new Set<string>();
    this.transactions.forEach((transaction) => spaces.add(transaction.space));
    return Array.from(spaces).sort();
  }

  /**
   * Get transactions grouped by their space property
   */
  getTransactionsBySpace(): SpaceProjectionGroup[] {
    const spaces = this.getSpaces();

    return spaces.map((space) => {
      const spaceTransactions = this.transactions.filter(
        (transaction) => transaction.space === space,
      );

      return {
        space,
        transactions: spaceTransactions,
        monthlyTotals: new Map(),
      };
    });
  }

  /**
   * Get grouped transactions with monthly totals for projection
   */
  getProjectionData(
    startDate: Date,
    monthCount: number,
  ): {
    spaces: SpaceProjectionGroup[];
    monthlyTotals: Map<
      string,
      { income: number; expense: number; net: number }
    >;
    months: Date[];
  } {
    const months: Date[] = [];
    for (let i = 0; i < monthCount; i++) {
      const month = new Date(startDate);
      month.setMonth(startDate.getMonth() + i);
      months.push(startOfMonth(month));
    }

    const spaces = this.getTransactionsBySpace();

    // Calculate monthly totals for each space
    spaces.forEach((space) => {
      months.forEach((month) => {
        const monthKey = format(month, "yyyy-MM");
        const total = space.transactions.reduce((sum, transaction) => {
          return sum + transaction.getAmountForMonth(month);
        }, 0);
        space.monthlyTotals.set(monthKey, total);
      });
    });

    // Calculate overall monthly totals
    const monthlyTotals = new Map<
      string,
      { income: number; expense: number; net: number }
    >();
    months.forEach((month) => {
      const monthKey = format(month, "yyyy-MM");
      const income = this.getTotalForMonth(month, "income");
      const expense = this.getTotalForMonth(month, "expense");
      monthlyTotals.set(monthKey, {
        income,
        expense,
        net: income + expense,
      });
    });

    return { spaces, monthlyTotals, months };
  }

  getCurrentMonthBreakdownBySpace(targetDate: Date): SpaceMonthBreakdown[] {
    return this.getTransactionsBySpace()
      .map((spaceGroup) => {
        const activeTransactions = spaceGroup.transactions.filter((transaction) =>
          transaction.isActiveInMonth(targetDate),
        );

        const income = activeTransactions
          .filter((transaction) => transaction.type === "income")
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        const expense = activeTransactions
          .filter((transaction) => transaction.type === "expense")
          .reduce((sum, transaction) => sum + transaction.amount, 0);
        const net = income + expense;

        return {
          space: spaceGroup.space,
          income,
          expense,
          net,
        };
      })
      .filter(
        (spaceBreakdown) =>
          spaceBreakdown.income !== 0 ||
          spaceBreakdown.expense !== 0 ||
          spaceBreakdown.net !== 0,
      );
  }

  /**
   * Add an transaction to the collection
   */
  add(transaction: Transaction): void {
    this.transactions.push(transaction);
  }

  /**
   * Remove an transaction from the collection
   */
  remove(transactionId: string): void {
    this.transactions = this.transactions.filter((transaction) => transaction.id !== transactionId);
  }

  /**
   * Get collection size
   */
  count(): number {
    return this.transactions.length;
  }
}
