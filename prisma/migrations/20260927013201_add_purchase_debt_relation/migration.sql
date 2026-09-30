-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Debt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "remaining" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "ticketId" INTEGER,
    "purchaseId" INTEGER,
    CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Debt_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Debt_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Debt" ("createdAt", "dueDate", "id", "notes", "personName", "remaining", "status", "ticketId", "total", "type", "updatedAt", "userId") SELECT "createdAt", "dueDate", "id", "notes", "personName", "remaining", "status", "ticketId", "total", "type", "updatedAt", "userId" FROM "Debt";
DROP TABLE "Debt";
ALTER TABLE "new_Debt" RENAME TO "Debt";
CREATE UNIQUE INDEX "Debt_purchaseId_key" ON "Debt"("purchaseId");
CREATE INDEX "Debt_userId_status_idx" ON "Debt"("userId", "status");
CREATE INDEX "Debt_ticketId_idx" ON "Debt"("ticketId");
CREATE INDEX "Debt_type_status_idx" ON "Debt"("type", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
