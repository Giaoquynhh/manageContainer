-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "customer_deleted_at" TIMESTAMP(3),
ADD COLUMN     "depot_deleted_at" TIMESTAMP(3),
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by" TEXT,
ADD COLUMN     "rejected_reason" TEXT;

-- CreateIndex
CREATE INDEX "ServiceRequest_depot_deleted_at_idx" ON "ServiceRequest"("depot_deleted_at");

-- CreateIndex
CREATE INDEX "ServiceRequest_customer_deleted_at_idx" ON "ServiceRequest"("customer_deleted_at");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");
