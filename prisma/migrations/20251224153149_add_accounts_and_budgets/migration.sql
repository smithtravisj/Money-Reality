/*
  Warnings:

  - Added the required column `accountId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable "Account" first
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "colorTag" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- Create default "Cash" account for each existing user
INSERT INTO "Account" ("id", "userId", "name", "type", "currentBalance", "notes", "order", "isDefault", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id" as "userId",
    'Cash',
    'cash',
    0,
    '',
    0,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User";

-- AlterTable "Transaction" - add accountId as nullable first
ALTER TABLE "Transaction" ADD COLUMN "accountId" TEXT;

-- Update all transactions to use the default Cash account
UPDATE "Transaction" t
SET "accountId" = a."id"
FROM "Account" a
WHERE t."userId" = a."userId" AND a."name" = 'Cash';

-- Now make accountId NOT NULL
ALTER TABLE "Transaction" ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable "Category" - add budget fields
ALTER TABLE "Category" ADD COLUMN "budgetPeriod" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN "monthlyBudget" DOUBLE PRECISION;

-- AlterTable "Settings" - add defaultAccountId
ALTER TABLE "Settings" ADD COLUMN "defaultAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Account_type_idx" ON "Account"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_name_key" ON "Account"("userId", "name");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
