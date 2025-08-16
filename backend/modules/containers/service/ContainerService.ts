import { prisma } from '../../../shared/config/database';

export class ContainerService {
	async get(container_no: string) {
		const meta = await prisma.containerMeta.findUnique({ where: { container_no } });
		const slot = await prisma.yardSlot.findFirst({ where: { occupant_container_no: container_no }, include: { block: { include: { yard: true } } } });
		return { meta, position: slot };
	}
	async alerts() {
		const now = new Date();
		const items = await prisma.containerMeta.findMany({ where: { OR: [ { dem_date: { lte: now } }, { det_date: { lte: now } } ] } });
		return items;
	}
}

export default new ContainerService();


