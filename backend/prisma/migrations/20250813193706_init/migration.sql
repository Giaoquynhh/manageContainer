-- CreateTable
CREATE TABLE "Yard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Yard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YardBlock" (
    "id" TEXT NOT NULL,
    "yard_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "YardBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YardSlot" (
    "id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "kind" TEXT,
    "near_gate" INTEGER NOT NULL DEFAULT 0,
    "avoid_main" INTEGER NOT NULL DEFAULT 0,
    "is_odd" BOOLEAN NOT NULL DEFAULT false,
    "occupant_container_no" TEXT,
    "reserved_expire_at" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YardSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContainerMeta" (
    "id" TEXT NOT NULL,
    "container_no" TEXT NOT NULL,
    "dem_date" TIMESTAMP(3),
    "det_date" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContainerMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForkliftTask" (
    "id" TEXT NOT NULL,
    "container_no" TEXT NOT NULL,
    "from_slot_id" TEXT,
    "to_slot_id" TEXT,
    "status" TEXT NOT NULL,
    "assigned_driver_id" TEXT,
    "created_by" TEXT NOT NULL,
    "cancel_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForkliftTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YardBlock_yard_id_idx" ON "YardBlock"("yard_id");

-- CreateIndex
CREATE INDEX "YardSlot_block_id_idx" ON "YardSlot"("block_id");

-- CreateIndex
CREATE INDEX "YardSlot_occupant_container_no_idx" ON "YardSlot"("occupant_container_no");

-- CreateIndex
CREATE UNIQUE INDEX "ContainerMeta_container_no_key" ON "ContainerMeta"("container_no");

-- AddForeignKey
ALTER TABLE "YardBlock" ADD CONSTRAINT "YardBlock_yard_id_fkey" FOREIGN KEY ("yard_id") REFERENCES "Yard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YardSlot" ADD CONSTRAINT "YardSlot_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "YardBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForkliftTask" ADD CONSTRAINT "ForkliftTask_from_slot_id_fkey" FOREIGN KEY ("from_slot_id") REFERENCES "YardSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForkliftTask" ADD CONSTRAINT "ForkliftTask_to_slot_id_fkey" FOREIGN KEY ("to_slot_id") REFERENCES "YardSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
