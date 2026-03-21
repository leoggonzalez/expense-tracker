-- DropForeignKey
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_spaceId_fkey";
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_transferSpaceId_fkey";

-- Rename table and dependent objects
ALTER TABLE "Entry" RENAME TO "Transaction";
ALTER INDEX "Entry_pkey" RENAME TO "Transaction_pkey";
ALTER INDEX "Entry_spaceId_idx" RENAME TO "Transaction_spaceId_idx";
ALTER INDEX "Entry_transferSpaceId_idx" RENAME TO "Transaction_transferSpaceId_idx";
ALTER INDEX "Entry_beginDate_idx" RENAME TO "Transaction_beginDate_idx";

-- Rename space counter column
ALTER TABLE "Space" RENAME COLUMN "currentMonthEntryCount" TO "currentMonthTransactionCount";

-- AddForeignKey
ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_spaceId_fkey"
FOREIGN KEY ("spaceId") REFERENCES "Space"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_transferSpaceId_fkey"
FOREIGN KEY ("transferSpaceId") REFERENCES "Space"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
