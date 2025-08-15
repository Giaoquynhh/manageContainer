/*
  Warnings:

  - You are about to drop the column `delete_reason` on the `DocumentFile` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `DocumentFile` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_by` on the `DocumentFile` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `DocumentFile` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `DocumentFile` table. All the data in the column will be lost.
  - You are about to drop the column `storage_key` on the `DocumentFile` table. All the data in the column will be lost.
  - You are about to drop the column `uploader_id` on the `DocumentFile` table. All the data in the column will be lost.
  - Added the required column `mimeType` to the `DocumentFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `DocumentFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeBytes` to the `DocumentFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storageKey` to the `DocumentFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storedName` to the `DocumentFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaderId` to the `DocumentFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DocumentFile" DROP COLUMN "delete_reason",
DROP COLUMN "deleted_at",
DROP COLUMN "deleted_by",
DROP COLUMN "name",
DROP COLUMN "size",
DROP COLUMN "storage_key",
DROP COLUMN "uploader_id",
ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "sizeBytes" INTEGER NOT NULL,
ADD COLUMN     "storageKey" TEXT NOT NULL,
ADD COLUMN     "storedName" TEXT NOT NULL,
ADD COLUMN     "uploaderId" TEXT NOT NULL,
ALTER COLUMN "version" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "documentsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "DocumentFile_createdAt_idx" ON "DocumentFile"("createdAt");
