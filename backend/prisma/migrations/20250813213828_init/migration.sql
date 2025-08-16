-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "invoice_no" TEXT,
    "customer_id" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "subtotal" DECIMAL(18,2) NOT NULL,
    "tax_amount" DECIMAL(18,2) NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paid_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "source_module" TEXT,
    "source_id" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "invoice_id" TEXT NOT NULL,
    "service_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "unit_price" DECIMAL(18,4) NOT NULL,
    "line_amount" DECIMAL(18,2) NOT NULL,
    "tax_code" TEXT,
    "tax_rate" DECIMAL(5,2),
    "tax_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_line_amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "payment_no" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "paid_date" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "reference_no" TEXT,
    "notes" TEXT,
    "idempotency_key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "payment_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "allocated_amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "org_id" TEXT,
    "type" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "file_key" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_org_id_status_issue_date_idx" ON "Invoice"("org_id", "status", "issue_date");

-- CreateIndex
CREATE INDEX "Invoice_org_id_customer_id_issue_date_idx" ON "Invoice"("org_id", "customer_id", "issue_date");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_org_id_invoice_no_key" ON "Invoice"("org_id", "invoice_no");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoice_id_idx" ON "InvoiceLineItem"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_payment_no_key" ON "Payment"("payment_no");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotency_key_key" ON "Payment"("idempotency_key");

-- CreateIndex
CREATE INDEX "Payment_org_id_paid_date_idx" ON "Payment"("org_id", "paid_date");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoice_id_idx" ON "PaymentAllocation"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_payment_id_invoice_id_key" ON "PaymentAllocation"("payment_id", "invoice_id");

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
