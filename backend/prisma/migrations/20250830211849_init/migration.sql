-- CreateIndex
CREATE INDEX "Invoice_source_id_idx" ON "Invoice"("source_id");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
