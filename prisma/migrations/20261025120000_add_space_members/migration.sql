CREATE TABLE "SpaceMember" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "removedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpaceMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SpaceMember_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SpaceMember_spaceId_idx" ON "SpaceMember"("spaceId");
ALTER TABLE "SpaceMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ADD COLUMN "splitParticipantIds" TEXT;
