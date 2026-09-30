-- CreateTable
CREATE TABLE "Local" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Local_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "paymentType" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "localId" INTEGER,
    "cashBoxId" INTEGER,
    CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_cashBoxId_fkey" FOREIGN KEY ("cashBoxId") REFERENCES "CashBox" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicketItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "productId" INTEGER,
    CONSTRAINT "TicketItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TicketItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashBox" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "initialCapital" REAL NOT NULL DEFAULT 0,
    "currentBalance" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "CashBox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "cashBoxId" INTEGER NOT NULL,
    CONSTRAINT "CashMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CashMovement_cashBoxId_fkey" FOREIGN KEY ("cashBoxId") REFERENCES "CashBox" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Debt" (
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
    CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Debt_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "total" REAL NOT NULL,
    "profit" REAL NOT NULL DEFAULT 0,
    "paymentType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "id", "paymentType", "total", "userId") SELECT "createdAt", "id", "paymentType", "total", "userId" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");
CREATE INDEX "Sale_userId_idx" ON "Sale"("userId");
CREATE TABLE "new_SaleItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" INTEGER NOT NULL,
    "price" REAL,
    "unitPrice" REAL,
    "costPrice" REAL,
    "profit" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "productName" TEXT,
    "saleId" INTEGER NOT NULL,
    "productId" INTEGER,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SaleItem" ("costPrice", "id", "price", "productId", "quantity", "saleId", "subtotal", "unitPrice") SELECT "costPrice", "id", "price", "productId", "quantity", "saleId", "subtotal", "unitPrice" FROM "SaleItem";
DROP TABLE "SaleItem";
ALTER TABLE "new_SaleItem" RENAME TO "SaleItem";
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Local_userId_active_idx" ON "Local"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Local_userId_name_key" ON "Local"("userId", "name");

-- CreateIndex
CREATE INDEX "Ticket_userId_createdAt_idx" ON "Ticket"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_localId_idx" ON "Ticket"("localId");

-- CreateIndex
CREATE INDEX "Ticket_cashBoxId_idx" ON "Ticket"("cashBoxId");

-- CreateIndex
CREATE INDEX "Ticket_paymentStatus_idx" ON "Ticket"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_userId_number_key" ON "Ticket"("userId", "number");

-- CreateIndex
CREATE INDEX "TicketItem_ticketId_idx" ON "TicketItem"("ticketId");

-- CreateIndex
CREATE INDEX "TicketItem_productId_idx" ON "TicketItem"("productId");

-- CreateIndex
CREATE INDEX "CashBox_userId_active_idx" ON "CashBox"("userId", "active");

-- CreateIndex
CREATE INDEX "CashMovement_cashBoxId_createdAt_idx" ON "CashMovement"("cashBoxId", "createdAt");

-- CreateIndex
CREATE INDEX "CashMovement_userId_createdAt_idx" ON "CashMovement"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CashMovement_referenceType_referenceId_idx" ON "CashMovement"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "Debt_userId_status_idx" ON "Debt"("userId", "status");

-- CreateIndex
CREATE INDEX "Debt_ticketId_idx" ON "Debt"("ticketId");

-- CreateIndex
CREATE INDEX "Debt_type_status_idx" ON "Debt"("type", "status");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_userId_createdAt_idx" ON "StockMovement"("userId", "createdAt");
