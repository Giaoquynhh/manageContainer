import { prisma } from '../../../shared/config/database';

export class PartnerRepository {
	create(data: any) { return prisma.partner.create({ data }); }
	findById(id: string) { return prisma.partner.findUnique({ where: { id } }); }
	findByName(name: string) { return prisma.partner.findUnique({ where: { name } }); }
	updateById(id: string, data: any) { return prisma.partner.update({ where: { id }, data }); }
	list(filter: any, skip: number, limit: number) { return prisma.partner.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip, take: limit }); }
	count(filter: any) { return prisma.partner.count({ where: filter }); }
}

export default new PartnerRepository();
