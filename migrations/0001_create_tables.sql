-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" BIGINT NOT NULL,
    "customer_id" TEXT,
    CONSTRAINT "users_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("customer_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscription_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "invoice_id" TEXT NOT NULL,
    CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "collection_method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_customer_id_key" ON "users"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_id_key" ON "customers"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscription_id_key" ON "subscriptions"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_id_key" ON "invoices"("invoice_id");
