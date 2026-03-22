-- CreateEnum
CREATE TYPE "CreditCardPaymentTiming" AS ENUM ('same_month', 'previous_month');

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "paymentTiming" "CreditCardPaymentTiming";
