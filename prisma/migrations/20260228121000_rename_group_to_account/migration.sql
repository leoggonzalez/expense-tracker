-- DropForeignKey
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_groupId_fkey";

-- Rename table and dependent objects
ALTER TABLE "Group" RENAME TO "Account";
ALTER INDEX "Group_pkey" RENAME TO "Account_pkey";
ALTER INDEX "Group_userId_idx" RENAME TO "Account_userId_idx";
ALTER TABLE "Account" RENAME CONSTRAINT "Group_userId_fkey" TO "Account_userId_fkey";

-- Rename entry relation column
ALTER TABLE "Entry" RENAME COLUMN "groupId" TO "accountId";
ALTER INDEX "Entry_groupId_idx" RENAME TO "Entry_accountId_idx";

-- Replace global uniqueness with per-user uniqueness
DROP INDEX "Group_name_key";
CREATE UNIQUE INDEX "Account_userId_name_key" ON "Account"("userId", "name");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
