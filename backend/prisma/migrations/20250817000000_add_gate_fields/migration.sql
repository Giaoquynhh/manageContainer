-- Add Gate fields to ServiceRequest
ALTER TABLE "ServiceRequest" ADD COLUMN "forwarded_at" TIMESTAMP(3);
ALTER TABLE "ServiceRequest" ADD COLUMN "forwarded_by" TEXT;
ALTER TABLE "ServiceRequest" ADD COLUMN "gate_checked_at" TIMESTAMP(3);
ALTER TABLE "ServiceRequest" ADD COLUMN "gate_checked_by" TEXT;
ALTER TABLE "ServiceRequest" ADD COLUMN "gate_reason" TEXT;

-- Update existing status values
UPDATE "ServiceRequest" SET status = 'SCHEDULED' WHERE status = 'RECEIVED';
UPDATE "ServiceRequest" SET status = 'FORWARDED' WHERE status = 'SENT_TO_GATE';

-- Create indexes for better performance
CREATE INDEX "ServiceRequest_forwarded_at_idx" ON "ServiceRequest"("forwarded_at");
CREATE INDEX "ServiceRequest_gate_checked_at_idx" ON "ServiceRequest"("gate_checked_at");
