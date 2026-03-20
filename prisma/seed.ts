import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TransactionType = "income" | "expense";
type RecurringMode = "open_ended" | "fixed";

type RecurringTemplate = {
  description: string;
  type: TransactionType;
  mode: RecurringMode;
  amountRange: [number, number];
  startMonthOffsetRange: [number, number];
  durationMonthRange?: [number, number];
};

type SpaceSeedSpec = {
  name: string;
  targetTransactions: number;
  oneTimeIncomeRatio: number;
  oneTimeExpenseDescriptions: string[];
  oneTimeIncomeDescriptions: string[];
  recurringTemplates: RecurringTemplate[];
  oneTimeExpenseRange: [number, number];
  oneTimeIncomeRange: [number, number];
};

const ACCOUNT_SPECS: SpaceSeedSpec[] = [
  {
    name: "Amex credit card",
    targetTransactions: 35,
    oneTimeIncomeRatio: 0.08,
    recurringTemplates: [
      {
        description: "Phone installment",
        type: "expense",
        mode: "fixed",
        amountRange: [45, 85],
        startMonthOffsetRange: [-16, -8],
        durationMonthRange: [10, 18],
      },
      {
        description: "Gym membership",
        type: "expense",
        mode: "open_ended",
        amountRange: [28, 49],
        startMonthOffsetRange: [-20, -6],
      },
      {
        description: "Streaming bundle",
        type: "expense",
        mode: "open_ended",
        amountRange: [18, 35],
        startMonthOffsetRange: [-20, -4],
      },
    ],
    oneTimeExpenseDescriptions: [
      "Groceries",
      "Dining out",
      "Fuel",
      "Online shopping",
      "Travel booking",
      "Electronics",
      "Pharmacy",
      "Household supplies",
    ],
    oneTimeIncomeDescriptions: ["Card refund", "Cashback reversal", "Chargeback"],
    oneTimeExpenseRange: [12, 420],
    oneTimeIncomeRange: [8, 95],
  },
  {
    name: "Visa credit card",
    targetTransactions: 34,
    oneTimeIncomeRatio: 0.07,
    recurringTemplates: [
      {
        description: "Cloud storage",
        type: "expense",
        mode: "open_ended",
        amountRange: [5, 18],
        startMonthOffsetRange: [-22, -7],
      },
      {
        description: "Music subscription",
        type: "expense",
        mode: "open_ended",
        amountRange: [8, 16],
        startMonthOffsetRange: [-22, -8],
      },
      {
        description: "Laptop installment",
        type: "expense",
        mode: "fixed",
        amountRange: [60, 130],
        startMonthOffsetRange: [-18, -10],
        durationMonthRange: [8, 14],
      },
    ],
    oneTimeExpenseDescriptions: [
      "Groceries",
      "Restaurant",
      "Parking",
      "Taxi",
      "Weekend trip",
      "Pet supplies",
      "Hardware store",
      "Books",
    ],
    oneTimeIncomeDescriptions: ["Vendor refund", "Return credit"],
    oneTimeExpenseRange: [10, 390],
    oneTimeIncomeRange: [10, 80],
  },
  {
    name: "Main space",
    targetTransactions: 38,
    oneTimeIncomeRatio: 0.45,
    recurringTemplates: [
      {
        description: "Salary",
        type: "income",
        mode: "open_ended",
        amountRange: [4200, 5200],
        startMonthOffsetRange: [-24, -12],
      },
      {
        description: "Apartment transfer",
        type: "expense",
        mode: "open_ended",
        amountRange: [950, 1450],
        startMonthOffsetRange: [-24, -10],
      },
      {
        description: "Investment contribution",
        type: "expense",
        mode: "open_ended",
        amountRange: [300, 700],
        startMonthOffsetRange: [-22, -8],
      },
      {
        description: "Bonus plan",
        type: "income",
        mode: "fixed",
        amountRange: [450, 1200],
        startMonthOffsetRange: [-14, -5],
        durationMonthRange: [4, 9],
      },
    ],
    oneTimeExpenseDescriptions: [
      "Insurance",
      "Medical appointment",
      "Furniture",
      "Transfer to savings",
      "Emergency repair",
    ],
    oneTimeIncomeDescriptions: [
      "Freelance payment",
      "Tax refund",
      "Expense reimbursement",
      "Gift received",
      "Annual bonus",
    ],
    oneTimeExpenseRange: [40, 1600],
    oneTimeIncomeRange: [150, 3200],
  },
  {
    name: "Main-street",
    targetTransactions: 33,
    oneTimeIncomeRatio: 0.03,
    recurringTemplates: [
      {
        description: "Main-street rent",
        type: "expense",
        mode: "open_ended",
        amountRange: [1180, 1380],
        startMonthOffsetRange: [-24, -12],
      },
      {
        description: "Main-street utilities",
        type: "expense",
        mode: "open_ended",
        amountRange: [110, 220],
        startMonthOffsetRange: [-24, -10],
      },
      {
        description: "Condo services",
        type: "expense",
        mode: "open_ended",
        amountRange: [60, 130],
        startMonthOffsetRange: [-22, -6],
      },
    ],
    oneTimeExpenseDescriptions: [
      "Appliance repair",
      "Plumber",
      "Painting",
      "Cleaning service",
      "Small maintenance",
    ],
    oneTimeIncomeDescriptions: ["Deposit reimbursement"],
    oneTimeExpenseRange: [45, 680],
    oneTimeIncomeRange: [40, 250],
  },
  {
    name: "Old-street",
    targetTransactions: 32,
    oneTimeIncomeRatio: 0.04,
    recurringTemplates: [
      {
        description: "Old-street rent",
        type: "expense",
        mode: "open_ended",
        amountRange: [820, 980],
        startMonthOffsetRange: [-24, -14],
      },
      {
        description: "Old-street internet",
        type: "expense",
        mode: "open_ended",
        amountRange: [35, 75],
        startMonthOffsetRange: [-24, -8],
      },
      {
        description: "Old-street utilities",
        type: "expense",
        mode: "fixed",
        amountRange: [70, 140],
        startMonthOffsetRange: [-18, -6],
        durationMonthRange: [8, 16],
      },
    ],
    oneTimeExpenseDescriptions: [
      "Leak fix",
      "Old-street repaint",
      "Minor renovation",
      "Home supplies",
      "Electrician",
    ],
    oneTimeIncomeDescriptions: ["Overpayment refund"],
    oneTimeExpenseRange: [30, 620],
    oneTimeIncomeRange: [20, 180],
  },
  {
    name: "Investments",
    targetTransactions: 36,
    oneTimeIncomeRatio: 0.45,
    recurringTemplates: [
      {
        description: "ETF contribution",
        type: "expense",
        mode: "open_ended",
        amountRange: [250, 650],
        startMonthOffsetRange: [-24, -10],
      },
      {
        description: "Dividend payout",
        type: "income",
        mode: "fixed",
        amountRange: [80, 260],
        startMonthOffsetRange: [-16, -6],
        durationMonthRange: [6, 14],
      },
      {
        description: "Broker fee",
        type: "expense",
        mode: "open_ended",
        amountRange: [4, 18],
        startMonthOffsetRange: [-24, -12],
      },
    ],
    oneTimeExpenseDescriptions: [
      "Broker commission",
      "FX fee",
      "Portfolio rebalance",
      "Transfer to broker",
    ],
    oneTimeIncomeDescriptions: [
      "Stock sale",
      "Interest payment",
      "Fund distribution",
      "Bond coupon",
    ],
    oneTimeExpenseRange: [15, 1400],
    oneTimeIncomeRange: [35, 1800],
  },
  {
    name: "Subscriptions",
    targetTransactions: 31,
    oneTimeIncomeRatio: 0.03,
    recurringTemplates: [
      {
        description: "Streaming services",
        type: "expense",
        mode: "open_ended",
        amountRange: [18, 55],
        startMonthOffsetRange: [-24, -8],
      },
      {
        description: "Productivity apps",
        type: "expense",
        mode: "open_ended",
        amountRange: [15, 35],
        startMonthOffsetRange: [-22, -8],
      },
      {
        description: "Domain and hosting",
        type: "expense",
        mode: "fixed",
        amountRange: [90, 190],
        startMonthOffsetRange: [-16, -4],
        durationMonthRange: [6, 13],
      },
    ],
    oneTimeExpenseDescriptions: [
      "Annual renewal",
      "Add-on license",
      "Family plan upgrade",
      "One-time plugin",
    ],
    oneTimeIncomeDescriptions: ["Subscription refund"],
    oneTimeExpenseRange: [12, 240],
    oneTimeIncomeRange: [10, 55],
  },
];

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

function pickInteger(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function addMonths(base: Date, months: number): Date {
  const date = new Date(base);
  date.setMonth(date.getMonth() + months);
  return date;
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0, 0);
}

function buildDateFromMonthOffset(monthOffset: number, day: number): Date {
  const monthStart = addMonths(startOfCurrentMonth(), monthOffset);
  const date = new Date(monthStart);
  date.setDate(Math.max(1, Math.min(day, 28)));
  return date;
}

function randomAmount(
  random: () => number,
  type: TransactionType,
  range: [number, number],
): number {
  const [min, max] = range;
  const cents = pickInteger(random, toCents(min), toCents(max));
  const absolute = fromCents(cents);

  return type === "expense" ? -absolute : absolute;
}

function computeEndDate(
  beginDate: Date,
  mode: RecurringMode,
  random: () => number,
  durationMonthRange?: [number, number],
): Date | null {
  if (mode === "open_ended") {
    return null;
  }

  const durationRange = durationMonthRange || [6, 12];
  const durationMonths = pickInteger(random, durationRange[0], durationRange[1]);
  const endDate = addMonths(beginDate, Math.max(1, durationMonths));
  endDate.setDate(beginDate.getDate());

  return endDate;
}

async function refreshCurrentMonthCounters(): Promise<void> {
  const monthStart = startOfCurrentMonth();
  const monthEnd = addMonths(monthStart, 1);
  monthEnd.setMilliseconds(-1);

  await prisma.$executeRaw`
    UPDATE "Space" a
    SET "currentMonthTransactionCount" = COALESCE(month_counts."transactionCount", 0)
    FROM (
      SELECT
        a2.id AS "spaceId",
        COUNT(e.id)::integer AS "transactionCount"
      FROM "Space" a2
      LEFT JOIN "Transaction" e
        ON e."spaceId" = a2.id
       AND e."beginDate" <= ${monthEnd}
       AND (e."endDate" IS NULL OR e."endDate" >= ${monthStart})
      GROUP BY a2.id
    ) month_counts
    WHERE a.id = month_counts."spaceId"
  `;
}

async function main() {
  console.log("Starting scenario-based seed...");

  await prisma.loginCode.deleteMany();
  await prisma.session.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.space.deleteMany();
  await prisma.user.deleteMany();

  const seedEmail = getSeedEmail();

  const user = await prisma.user.create({
    data: {
      email: seedEmail,
      name: "Scenario Seed User",
    },
  });

  await prisma.space.createMany({
    data: ACCOUNT_SPECS.map((spaceSpec) => ({
      userId: user.id,
      name: spaceSpec.name,
      isArchived: false,
    })),
  });

  const spaces = await prisma.space.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  const spaceByName = new Map(spaces.map((space) => [space.name, space.id]));

  const transactionsData = ACCOUNT_SPECS.flatMap((spaceSpec, spaceIndex) => {
    const random = mulberry32(94731 + spaceIndex * 103);
    const spaceId = spaceByName.get(spaceSpec.name);

    if (!spaceId) {
      throw new Error(`Missing seeded space: ${spaceSpec.name}`);
    }

    const recurringTransactions = spaceSpec.recurringTemplates.map((template) => {
      const monthOffset = pickInteger(
        random,
        template.startMonthOffsetRange[0],
        template.startMonthOffsetRange[1],
      );

      const beginDate = buildDateFromMonthOffset(monthOffset, pickInteger(random, 1, 28));
      const endDate = computeEndDate(
        beginDate,
        template.mode,
        random,
        template.durationMonthRange,
      );

      return {
        spaceId,
        type: template.type,
        description: template.description,
        amount: randomAmount(random, template.type, template.amountRange),
        beginDate,
        endDate,
      };
    });

    const oneTimeCount = Math.max(0, spaceSpec.targetTransactions - recurringTransactions.length);

    const oneTimeTransactions = Array.from({ length: oneTimeCount }, (_, transactionIndex) => {
      const isIncome = random() < spaceSpec.oneTimeIncomeRatio;
      const type: TransactionType = isIncome ? "income" : "expense";

      const descriptionPool = isIncome
        ? spaceSpec.oneTimeIncomeDescriptions
        : spaceSpec.oneTimeExpenseDescriptions;

      const descriptionBase =
        descriptionPool[(transactionIndex + spaceIndex * 5) % descriptionPool.length];

      const monthOffset = pickInteger(random, -22, 2);
      const beginDate = buildDateFromMonthOffset(monthOffset, pickInteger(random, 1, 28));

      return {
        spaceId,
        type,
        description: `${descriptionBase} ${transactionIndex + 1}`,
        amount: randomAmount(
          random,
          type,
          type === "income"
            ? spaceSpec.oneTimeIncomeRange
            : spaceSpec.oneTimeExpenseRange,
        ),
        beginDate,
        endDate: new Date(beginDate),
      };
    });

    return [...recurringTransactions, ...oneTimeTransactions];
  });

  await prisma.transaction.createMany({
    data: transactionsData,
  });

  await refreshCurrentMonthCounters();

  const [userCount, spaceCount, transactionCount, recurringTransactions] = await Promise.all([
    prisma.user.count(),
    prisma.space.count(),
    prisma.transaction.count(),
    prisma.transaction.findMany({
      select: {
        beginDate: true,
        endDate: true,
      },
    }),
  ]);

  const recurringCount = recurringTransactions.filter((transaction) => {
    if (transaction.endDate === null) {
      return true;
    }

    return transaction.endDate > transaction.beginDate;
  }).length;

  console.log(`Seed user: ${seedEmail}`);
  console.log(`Users: ${userCount}`);
  console.log(`Spaces: ${spaceCount}`);
  console.log(`Transactions: ${transactionCount}`);
  console.log(`Recurring transactions: ${recurringCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
