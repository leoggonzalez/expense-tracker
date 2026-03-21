-- DropForeignKey
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_accountId_fkey";
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_transferAccountId_fkey";

-- Rename table and dependent objects
ALTER TABLE "Account" RENAME TO "Space";
ALTER INDEX "Account_pkey" RENAME TO "Space_pkey";
ALTER INDEX "Account_userId_idx" RENAME TO "Space_userId_idx";
ALTER INDEX "Account_userId_name_key" RENAME TO "Space_userId_name_key";
ALTER TABLE "Space" RENAME CONSTRAINT "Account_userId_fkey" TO "Space_userId_fkey";

-- Rename entry relation columns
ALTER TABLE "Entry" RENAME COLUMN "accountId" TO "spaceId";
ALTER TABLE "Entry" RENAME COLUMN "transferAccountId" TO "transferSpaceId";
ALTER INDEX "Entry_accountId_idx" RENAME TO "Entry_spaceId_idx";
ALTER INDEX "Entry_transferAccountId_idx" RENAME TO "Entry_transferSpaceId_idx";

-- AddForeignKey
ALTER TABLE "Entry"
ADD CONSTRAINT "Entry_spaceId_fkey"
FOREIGN KEY ("spaceId") REFERENCES "Space"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Entry"
ADD CONSTRAINT "Entry_transferSpaceId_fkey"
FOREIGN KEY ("transferSpaceId") REFERENCES "Space"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
