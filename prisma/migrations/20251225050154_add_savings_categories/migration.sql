-- CreateTable
CREATE TABLE "SavingsCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "targetAmount" DOUBLE PRECISION,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavingsCategory_userId_idx" ON "SavingsCategory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsCategory_userId_name_key" ON "SavingsCategory"("userId", "name");

-- AddForeignKey
ALTER TABLE "SavingsCategory" ADD CONSTRAINT "SavingsCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
