-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CashBox" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "initialCapital" REAL NOT NULL DEFAULT 0,
    "currentBalance" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CUP',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "CashBox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CashBox" ("active", "createdAt", "currency", "currentBalance", "id", "initialCapital", "name", "updatedAt", "userId") SELECT "active", "createdAt", "currency", "currentBalance", "id", "initialCapital", "name", "updatedAt", "userId" FROM "CashBox";
DROP TABLE "CashBox";
ALTER TABLE "new_CashBox" RENAME TO "CashBox";
CREATE INDEX "CashBox_userId_active_idx" ON "CashBox"("userId", "active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
