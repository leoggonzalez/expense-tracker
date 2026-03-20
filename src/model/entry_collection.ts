import { format, startOfMonth } from "date-fns";

import { Entry } from "@/model/entry";

export interface MonthlyData {
  month: Date;
  income: number;
  expense: number;
  net: number;
}

export interface SpaceProjectionGroup {
  space: string;
  entries: Entry[];
  monthlyTotals: Map<string, number>;
}

export interface SpaceMonthBreakdown {
  space: string;
  income: number;
  expense: number;
  net: number;
}

export class EntryCollection {
  private entries: Entry[];

  constructor(entries: Entry[]) {
    this.entries = entries;
  }

  /**
   * Get all entries
   */
  getAll(): Entry[] {
    return [...this.entries];
  }

  /**
   * Get entries filtered by type
   */
  getByType(type: "income" | "expense"): Entry[] {
    return this.entries.filter((entry) => entry.type === type);
  }

  /**
   * Get entries active in a specific month
   */
  getActiveInMonth(targetDate: Date): Entry[] {
    return this.entries.filter((entry) => entry.isActiveInMonth(targetDate));
  }

  /**
   * Get total for a specific month and type
   */
  getTotalForMonth(targetDate: Date, type?: "income" | "expense"): number {
    let filtered = this.getActiveInMonth(targetDate);

    if (type) {
      filtered = filtered.filter((entry) => entry.type === type);
    }

    return filtered.reduce((sum, entry) => sum + entry.amount, 0);
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
    this.entries.forEach((entry) => spaces.add(entry.space));
    return Array.from(spaces).sort();
  }

  /**
   * Get entries grouped by their space property
   */
  getEntriesBySpace(): SpaceProjectionGroup[] {
    const spaces = this.getSpaces();

    return spaces.map((space) => {
      const spaceEntries = this.entries.filter(
        (entry) => entry.space === space,
      );

      return {
        space,
        entries: spaceEntries,
        monthlyTotals: new Map(),
      };
    });
  }

  /**
   * Get grouped entries with monthly totals for projection
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

    const spaces = this.getEntriesBySpace();

    // Calculate monthly totals for each space
    spaces.forEach((space) => {
      months.forEach((month) => {
        const monthKey = format(month, "yyyy-MM");
        const total = space.entries.reduce((sum, entry) => {
          return sum + entry.getAmountForMonth(month);
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
    return this.getEntriesBySpace()
      .map((spaceGroup) => {
        const activeEntries = spaceGroup.entries.filter((entry) =>
          entry.isActiveInMonth(targetDate),
        );

        const income = activeEntries
          .filter((entry) => entry.type === "income")
          .reduce((sum, entry) => sum + entry.amount, 0);
        const expense = activeEntries
          .filter((entry) => entry.type === "expense")
          .reduce((sum, entry) => sum + entry.amount, 0);
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
   * Add an entry to the collection
   */
  add(entry: Entry): void {
    this.entries.push(entry);
  }

  /**
   * Remove an entry from the collection
   */
  remove(entryId: string): void {
    this.entries = this.entries.filter((entry) => entry.id !== entryId);
  }

  /**
   * Get collection size
   */
  count(): number {
    return this.entries.length;
  }
}
