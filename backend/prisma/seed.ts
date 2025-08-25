import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(){
	const email = 'admin@smartlog.local';
	const password = 'Admin@1234';
	const password_hash = await bcrypt.hash(password, 10);
	await prisma.user.upsert({
		where: { email },
		update: {},
		create: {
			email,
			full_name: 'System Admin',
			role: 'SystemAdmin',
			status: 'ACTIVE',
			password_hash
		}
	});
	console.log('Seeded SystemAdmin:', email, password);

	// Seed minimal Yard layout for demo if missing
	const yards = await prisma.yard.count();
	if (yards === 0) {
		const yard = await prisma.yard.create({ data: { name: 'Depot A' } });
		for (let bi = 1; bi <= 2; bi++) {
			const block = await prisma.yardBlock.create({ data: { yard_id: yard.id, code: `B${bi}` } });
			const slots = new Array(20).fill(0).map((_, idx) => ({
				block_id: block.id,
				code: `${block.code}-${idx+1}`,
				status: 'EMPTY',
				near_gate: 20 - idx,
				avoid_main: idx % 5 === 0 ? 1 : 0,
				is_odd: (idx % 2) === 1
			}));
			await prisma.yardSlot.createMany({ data: slots });
		}
		console.log('Seeded Yard layout sample (Depot A)');
	}

	// Enrich mock data: set a few slots to different statuses and create container meta & forklift tasks
	const slots = await prisma.yardSlot.findMany({ take: 40, orderBy: { code: 'asc' } });
	if (slots.length > 0) {
		const containerNos = ['TGHU1234567','MSCU7654321','CMAU2468135','ONEU9753186','HLCU1122334'];
		const now = new Date();
		// Mark first 5 as OCCUPIED
		for (let i = 0; i < Math.min(5, slots.length); i++) {
			await prisma.yardSlot.update({ where: { id: slots[i].id }, data: { status: 'OCCUPIED', occupant_container_no: containerNos[i % containerNos.length] } });
			// container meta with dem/det around now
			await prisma.containerMeta.upsert({
				where: { container_no: containerNos[i % containerNos.length] },
				update: {},
				create: {
					container_no: containerNos[i % containerNos.length],
					dem_date: new Date(now.getTime() + (i - 2) * 24*3600*1000), // some past, some future

					det_date: new Date(now.getTime() + (i - 1) * 24*3600*1000)
				}
			});
		}
		// Next 3 RESERVED with expire
		for (let i = 5; i < Math.min(8, slots.length); i++) {
			await prisma.yardSlot.update({ where: { id: slots[i].id }, data: { status: 'RESERVED', reserved_expire_at: new Date(now.getTime() + 30*60*1000) } });
		}
		// Next 2 under maintenance
		for (let i = 8; i < Math.min(10, slots.length); i++) {
			await prisma.yardSlot.update({ where: { id: slots[i].id }, data: { status: 'UNDER_MAINTENANCE' } });
		}

		// Forklift tasks demo
		if (slots.length >= 7) {
			await prisma.forkliftTask.createMany({ data: [
				{ container_no: containerNos[0], from_slot_id: slots[0].id, to_slot_id: slots[6].id, status: 'PENDING', created_by: 'system' },
				{ container_no: containerNos[1], from_slot_id: slots[1].id, to_slot_id: slots[5].id, status: 'IN_PROGRESS', created_by: 'system' },
				{ container_no: containerNos[2], from_slot_id: slots[2].id, to_slot_id: slots[4].id, status: 'COMPLETED', created_by: 'system' },
				{ container_no: containerNos[3], from_slot_id: slots[3].id, to_slot_id: slots[7].id, status: 'CANCELLED', cancel_reason: 'Khách đổi lệnh', created_by: 'system' }
			] });
		}
		console.log('Seeded mock occupancy, container meta, and forklift tasks');
	}

	// Seed Module 6: Inventory & Equipment
	const eqCount = await prisma.equipment.count();
	if (eqCount === 0) {
		await prisma.equipment.createMany({ data: [
			{ code: 'CONT-001', type: 'CONTAINER', status: 'ACTIVE' },
			{ code: 'EQP-01', type: 'EQUIPMENT', status: 'ACTIVE' }
		] });
	}
	const invCount = await prisma.inventoryItem.count();
	if (invCount === 0) {
		await prisma.inventoryItem.createMany({ data: [
			{ name: 'Sơn chống rỉ', uom: 'lit', qty_on_hand: 50, reorder_point: 10, unit_price: 150000 },
			{ name: 'Đinh tán', uom: 'pcs', qty_on_hand: 1000, reorder_point: 200, unit_price: 500 },
			{ name: 'Ron cao su', uom: 'pcs', qty_on_hand: 500, reorder_point: 100, unit_price: 2500 }
		] });
	}
}

main().finally(()=>prisma.$disconnect());
