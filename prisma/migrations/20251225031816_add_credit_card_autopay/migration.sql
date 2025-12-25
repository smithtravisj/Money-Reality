-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "autoPayAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Account_autoPayAccountId_idx" ON "Account"("autoPayAccountId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_autoPayAccountId_fkey" FOREIGN KEY ("autoPayAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
