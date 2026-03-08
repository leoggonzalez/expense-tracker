-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AlterTable
ALTER TABLE "Group" ADD COLUMN "userId" TEXT;

-- Bootstrap user
INSERT INTO "User" ("id", "email", "name", "createdAt", "updatedAt")
VALUES (
    'bootstrap_user',
    'bootstrap@local.invalid',
    'Bootstrap User',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

-- Backfill ownership
UPDATE "Group"
SET "userId" = (
    SELECT "id"
    FROM "User"
    WHERE "email" = 'bootstrap@local.invalid'
)
WHERE "userId" IS NULL;

-- Enforce ownership
ALTER TABLE "Group" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Group_userId_idx" ON "Group"("userId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
