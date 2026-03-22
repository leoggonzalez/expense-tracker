-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('credit_card');

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "paymentDueDay" INTEGER,
ADD COLUMN     "type" "SpaceType";
