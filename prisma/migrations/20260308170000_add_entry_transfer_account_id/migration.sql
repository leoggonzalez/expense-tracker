-- AlterTable
ALTER TABLE "Entry"
ADD COLUMN "transferAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Entry_transferAccountId_idx" ON "Entry"("transferAccountId");

-- AddForeignKey
ALTER TABLE "Entry"
ADD CONSTRAINT "Entry_transferAccountId_fkey"
FOREIGN KEY ("transferAccountId") REFERENCES "Account"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
