-- DropForeignKey
ALTER TABLE "RepairTicket" DROP CONSTRAINT "RepairTicket_equipment_id_fkey";

-- AlterTable
ALTER TABLE "RepairTicket" ALTER COLUMN "equipment_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RepairTicket" ADD CONSTRAINT "RepairTicket_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
