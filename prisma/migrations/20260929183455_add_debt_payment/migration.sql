-- CreateTable
CREATE TABLE "DebtPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "debtId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "cashBoxId" INTEGER NOT NULL,
    CONSTRAINT "DebtPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DebtPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DebtPayment_cashBoxId_fkey" FOREIGN KEY ("cashBoxId") REFERENCES "CashBox" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DebtPayment_debtId_createdAt_idx" ON "DebtPayment"("debtId", "createdAt");

-- CreateIndex
CREATE INDEX "DebtPayment_userId_createdAt_idx" ON "DebtPayment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DebtPayment_cashBoxId_createdAt_idx" ON "DebtPayment"("cashBoxId", "createdAt");
