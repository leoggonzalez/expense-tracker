import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ACCOUNT_COUNT = 10;
const ENTRIES_PER_ACCOUNT = 50;
const RECURRING_PER_ACCOUNT = 15; // 30% of 50
const FIXED_RECURRING_PER_ACCOUNT = 5;

const ACCOUNT_NAME_PREFIXES = [
  "Housing",
  "Utilities",
  "Groceries",
  "Transport",
  "Leisure",
  "Health",
  "Savings",
  "Investments",
  "Subscriptions",
  "Misc",
];

const EXPENSE_DESCRIPTIONS = [
  "Rent",
  "Electric bill",
  "Internet",
  "Groceries",
  "Dining out",
  "Fuel",
  "Gym membership",
  "Insurance",
  "Phone plan",
  "Streaming",
  "Pharmacy",
  "House supplies",
];

const INCOME_DESCRIPTIONS = [
  "Salary",
  "Freelance",
  "Bonus",
  "Side project",
  "Investment return",
  "Refund",
  "Tax adjustment",
  "Rental income",
];

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addMonths(base: Date, months: number): Date {
  const date = new Date(base);
  date.setMonth(date.getMonth() + months);
  return date;
}

function getSeedEmail(): string {
  return process.env.DEV_ADMIN_EMAIL?.trim() || "admin@example.com";
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

function nextExpenseAmount(random: () => number): number {
  // Range: -15.00 to -2500.00
  const cents = 1500 + Math.floor(random() * (250000 - 1500 + 1));
  return fromCents(-cents);
}

function nextIncomeAmount(random: () => number): number {
  // Range: 50.00 to 7000.00
  const cents = 5000 + Math.floor(random() * (700000 - 5000 + 1));
  return fromCents(cents);
}

function pickDescription(
  type: "income" | "expense",
  accountIndex: number,
  entryIndex: number,
): string {
  const source = type === "expense" ? EXPENSE_DESCRIPTIONS : INCOME_DESCRIPTIONS;
  const descriptor = source[(accountIndex * 11 + entryIndex * 7) % source.length];
  return `${descriptor} ${entryIndex + 1}`;
}

function computeBeginDate(random: () => number): Date {
  const now = new Date();
  const monthOffset = -23 + Math.floor(random() * 24); // within last 24 months
  const day = 1 + Math.floor(random() * 28);
  const date = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), monthOffset);
  date.setDate(day);
  return date;
}

function computeEndDate(
  beginDate: Date,
  mode: "non_recurring" | "fixed_recurring" | "open_ended",
  random: () => number,
): Date | null {
  if (mode === "open_ended") {
    return null;
  }

  if (mode === "non_recurring") {
    return new Date(beginDate);
  }

  // fixed recurring from 2 to 12 months
  const durationMonths = 2 + Math.floor(random() * 11);
  const endDate = addMonths(beginDate, durationMonths);

  // Keep same day where possible
  endDate.setDate(beginDate.getDate());

  if (endDate <= beginDate) {
    const fallback = new Date(beginDate);
    fallback.setMonth(fallback.getMonth() + 2);
    return fallback;
  }

  return endDate;
}

function getAccountName(index: number): string {
  return `${ACCOUNT_NAME_PREFIXES[index]} Account ${index + 1}`;
}

async function main() {
  console.log("Starting stress-test seed...");

  await prisma.loginCode.deleteMany();
  await prisma.session.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared users, accounts, entries, login codes, and sessions");

  const seedEmail = getSeedEmail();

  const user = await prisma.user.create({
    data: {
      email: seedEmail,
      name: "Stress Seed User",
    },
  });

  const accountData = Array.from({ length: ACCOUNT_COUNT }, (_, index) => ({
    userId: user.id,
    name: getAccountName(index),
  }));

  await prisma.account.createMany({
    data: accountData,
  });

  const accounts = await prisma.account.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      name: "asc",
    },
  });

  const entryData = accounts.flatMap((account, accountIndex) => {
    const random = mulberry32(12345 + accountIndex * 97);

    return Array.from({ length: ENTRIES_PER_ACCOUNT }, (_, entryIndex) => {
      const isRecurring = entryIndex < RECURRING_PER_ACCOUNT;
      const isFixedRecurring = entryIndex < FIXED_RECURRING_PER_ACCOUNT;

      const recurrenceMode = isRecurring
        ? isFixedRecurring
          ? "fixed_recurring"
          : "open_ended"
        : "non_recurring";

      const type: "income" | "expense" =
        entryIndex % 10 < 7 ? "expense" : "income";

      const beginDate = computeBeginDate(random);
      const endDate = computeEndDate(beginDate, recurrenceMode, random);
      const amount =
        type === "expense"
          ? nextExpenseAmount(random)
          : nextIncomeAmount(random);

      return {
        accountId: account.id,
        type,
        description: pickDescription(type, accountIndex, entryIndex),
        amount: fromCents(toCents(amount)),
        beginDate,
        endDate,
      };
    });
  });

  await prisma.entry.createMany({
    data: entryData,
  });

  const [userCount, accountCount, entryCount, recurringEntries] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.entry.count(),
    prisma.entry.findMany({
      select: {
        beginDate: true,
        endDate: true,
      },
    }),
  ]);
  const recurringCount = recurringEntries.filter((entry) => {
    if (entry.endDate === null) {
      return true;
    }

    return entry.endDate > entry.beginDate;
  }).length;

  console.log(`Seed user: ${seedEmail}`);
  console.log(`Users: ${userCount}`);
  console.log(`Accounts: ${accountCount}`);
  console.log(`Entries: ${entryCount}`);
  console.log(`Recurring entries: ${recurringCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
