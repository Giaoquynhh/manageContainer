/*
  Warnings:

  - The `status` column on the `RepairTicket` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "RepairTicket" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'GATE_IN';

-- DropEnum
DROP TYPE "RepairStatus";
