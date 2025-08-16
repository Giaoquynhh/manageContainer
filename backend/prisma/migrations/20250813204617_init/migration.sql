-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('CONTAINER', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "InventoryMoveType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "EquipmentType" NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "qty_on_hand" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "type" "InventoryMoveType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "ref_type" TEXT,
    "ref_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairTicket" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "status" "RepairStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "problem_description" TEXT NOT NULL,
    "estimated_cost" DOUBLE PRECISION DEFAULT 0,
    "manager_comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairTicketItem" (
    "id" TEXT NOT NULL,
    "repair_ticket_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "RepairTicketItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_name_key" ON "InventoryItem"("name");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventory_item_id_idx" ON "InventoryMovement"("inventory_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "RepairTicket_code_key" ON "RepairTicket"("code");

-- CreateIndex
CREATE INDEX "RepairTicket_equipment_id_idx" ON "RepairTicket"("equipment_id");

-- CreateIndex
CREATE INDEX "RepairTicketItem_repair_ticket_id_idx" ON "RepairTicketItem"("repair_ticket_id");

-- CreateIndex
CREATE INDEX "RepairTicketItem_inventory_item_id_idx" ON "RepairTicketItem"("inventory_item_id");

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairTicket" ADD CONSTRAINT "RepairTicket_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairTicketItem" ADD CONSTRAINT "RepairTicketItem_repair_ticket_id_fkey" FOREIGN KEY ("repair_ticket_id") REFERENCES "RepairTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairTicketItem" ADD CONSTRAINT "RepairTicketItem_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
