-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "appointment_location_id" TEXT,
ADD COLUMN     "appointment_location_type" TEXT,
ADD COLUMN     "appointment_note" TEXT,
ADD COLUMN     "appointment_time" TIMESTAMP(3),
ADD COLUMN     "attachments_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gate_ref" TEXT,
ADD COLUMN     "locked_attachments" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RequestAttachment" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "uploader_id" TEXT NOT NULL,
    "uploader_role" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "delete_reason" TEXT,

    CONSTRAINT "RequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sent_to" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestAttachment_request_id_idx" ON "RequestAttachment"("request_id");

-- CreateIndex
CREATE INDEX "RequestAttachment_uploader_id_idx" ON "RequestAttachment"("uploader_id");

-- CreateIndex
CREATE INDEX "RequestAttachment_uploaded_at_idx" ON "RequestAttachment"("uploaded_at");

-- CreateIndex
CREATE INDEX "Notification_request_id_idx" ON "Notification"("request_id");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE INDEX "ServiceRequest_appointment_time_idx" ON "ServiceRequest"("appointment_time");

-- AddForeignKey
ALTER TABLE "RequestAttachment" ADD CONSTRAINT "RequestAttachment_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAttachment" ADD CONSTRAINT "RequestAttachment_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
