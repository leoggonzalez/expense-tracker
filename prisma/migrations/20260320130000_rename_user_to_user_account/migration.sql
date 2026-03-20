-- DropForeignKey
ALTER TABLE "Space" DROP CONSTRAINT "Space_userId_fkey";
ALTER TABLE "LoginCode" DROP CONSTRAINT "LoginCode_userId_fkey";
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- Rename table and dependent objects
ALTER TABLE "User" RENAME TO "UserAccount";
ALTER INDEX "User_pkey" RENAME TO "UserAccount_pkey";
ALTER INDEX "User_email_key" RENAME TO "UserAccount_email_key";

-- Rename relation columns
ALTER TABLE "Space" RENAME COLUMN "userId" TO "userAccountId";
ALTER TABLE "LoginCode" RENAME COLUMN "userId" TO "userAccountId";
ALTER TABLE "Session" RENAME COLUMN "userId" TO "userAccountId";

ALTER INDEX "Space_userId_idx" RENAME TO "Space_userAccountId_idx";
ALTER INDEX "Space_userId_name_key" RENAME TO "Space_userAccountId_name_key";
ALTER INDEX "LoginCode_userId_idx" RENAME TO "LoginCode_userAccountId_idx";
ALTER INDEX "Session_userId_idx" RENAME TO "Session_userAccountId_idx";

-- AddForeignKey
ALTER TABLE "Space"
ADD CONSTRAINT "Space_userAccountId_fkey"
FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "LoginCode"
ADD CONSTRAINT "LoginCode_userAccountId_fkey"
FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Session"
ADD CONSTRAINT "Session_userAccountId_fkey"
FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
