import { prisma } from '../../../shared/config/database';

export class UserRepository {
	create(data: any) { return prisma.user.create({ data }); }
	findById(id: string) { return prisma.user.findUnique({ where: { id } }); }
	findByEmail(email: string) { return prisma.user.findUnique({ where: { email } }); }
	updateById(id: string, data: any) { return prisma.user.update({ where: { id }, data }); }
	deleteById(id: string) { return prisma.user.delete({ where: { id } }); }
	list(filter: any, skip: number, limit: number) { return prisma.user.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip, take: limit }); }
	count(filter: any) { return prisma.user.count({ where: filter }); }
}

export default new UserRepository();
