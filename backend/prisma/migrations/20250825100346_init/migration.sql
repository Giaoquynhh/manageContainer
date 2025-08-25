/*
  Warnings:

  - The values [PENDING_APPROVAL,APPROVED] on the enum `RepairStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RepairStatus_new" AS ENUM ('CHECKING', 'PENDING_ACCEPT', 'REPAIRING', 'CHECKED', 'REJECTED');
ALTER TABLE "RepairTicket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "RepairTicket" ALTER COLUMN "status" TYPE "RepairStatus_new" USING ("status"::text::"RepairStatus_new");
ALTER TYPE "RepairStatus" RENAME TO "RepairStatus_old";
ALTER TYPE "RepairStatus_new" RENAME TO "RepairStatus";
DROP TYPE "RepairStatus_old";
ALTER TABLE "RepairTicket" ALTER COLUMN "status" SET DEFAULT 'CHECKING';
COMMIT;

-- AlterTable
ALTER TABLE "RepairTicket" ALTER COLUMN "status" SET DEFAULT 'CHECKING';
