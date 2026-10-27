CREATE TYPE "TransactionCategory" AS ENUM (
  'shopping',
  'food_groceries',
  'bars_restaurants',
  'leisure_entertainment',
  'housing_public_services',
  'transport_car',
  'atm',
  'income',
  'family_friends',
  'uncategorized'
);

CREATE TYPE "TransactionCategorySource" AS ENUM (
  'manual',
  'learned',
  'rule',
  'fallback',
  'backfill'
);

ALTER TABLE "Transaction"
ADD COLUMN "category" "TransactionCategory" NOT NULL DEFAULT 'uncategorized',
ADD COLUMN "categorySource" "TransactionCategorySource" NOT NULL DEFAULT 'fallback';

ALTER TABLE "UserAccount"
ADD COLUMN "categoryRulesVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "CategoryMatch" (
  "id" TEXT NOT NULL,
  "userAccountId" TEXT NOT NULL,
  "normalizedDescription" TEXT NOT NULL,
  "transactionType" TEXT NOT NULL,
  "category" "TransactionCategory" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CategoryMatch_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CategoryMatch_transactionType_check"
    CHECK ("transactionType" IN ('income', 'expense'))
);

CREATE UNIQUE INDEX "CategoryMatch_userAccountId_normalizedDescription_transactionType_key"
ON "CategoryMatch"("userAccountId", "normalizedDescription", "transactionType");

ALTER TABLE "CategoryMatch"
ADD CONSTRAINT "CategoryMatch_userAccountId_fkey"
FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
