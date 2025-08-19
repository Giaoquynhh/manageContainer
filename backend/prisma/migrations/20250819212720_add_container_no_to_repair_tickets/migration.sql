-- AlterTable
ALTER TABLE "RepairTicket" ADD COLUMN     "container_no" TEXT;

-- CreateIndex
CREATE INDEX "RepairTicket_container_no_idx" ON "RepairTicket"("container_no");
