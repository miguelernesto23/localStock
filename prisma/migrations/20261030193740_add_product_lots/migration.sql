-- DropIndex
DROP INDEX "DebtPayment_cashBoxId_createdAt_idx";

-- CreateTable
CREATE TABLE "ProductLot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lotCode" TEXT,
    "purchaseDate" DATETIME NOT NULL,
    "initialQuantity" REAL NOT NULL,
    "availableQuantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "purchaseItemId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductLot_purchaseItemId_fkey" FOREIGN KEY ("purchaseItemId") REFERENCES "PurchaseItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleItemLot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" REAL NOT NULL,
    "saleItemId" INTEGER NOT NULL,
    "productLotId" INTEGER NOT NULL,
    CONSTRAINT "SaleItemLot_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItemLot_productLotId_fkey" FOREIGN KEY ("productLotId") REFERENCES "ProductLot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "note" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" INTEGER NOT NULL,
    "productLotId" INTEGER,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_productLotId_fkey" FOREIGN KEY ("productLotId") REFERENCES "ProductLot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" ("createdAt", "id", "note", "productId", "quantity", "reason", "type", "userId") SELECT "createdAt", "id", "note", "productId", "quantity", "reason", "type", "userId" FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");
CREATE INDEX "StockMovement_userId_createdAt_idx" ON "StockMovement"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProductLot_purchaseItemId_key" ON "ProductLot"("purchaseItemId");

-- CreateIndex
CREATE INDEX "ProductLot_productId_purchaseDate_idx" ON "ProductLot"("productId", "purchaseDate");

-- CreateIndex
CREATE INDEX "SaleItemLot_saleItemId_idx" ON "SaleItemLot"("saleItemId");

-- CreateIndex
CREATE INDEX "SaleItemLot_productLotId_idx" ON "SaleItemLot"("productLotId");

-- CreateIndex
CREATE INDEX "DebtPayment_cashBoxId_idx" ON "DebtPayment"("cashBoxId");

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "Product"("userId");
