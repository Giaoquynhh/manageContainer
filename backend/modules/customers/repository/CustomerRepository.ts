import { prisma } from '../../../shared/config/database';

export class CustomerRepository {
	create(data: any) { return prisma.customer.create({ data }); }
	findById(id: string) { return prisma.customer.findUnique({ where: { id } }); }
	findByTaxCode(tax_code: string) { return prisma.customer.findUnique({ where: { tax_code } }); }
	findByName(name: string) { return prisma.customer.findUnique({ where: { name } }); }
	updateById(id: string, data: any) { return prisma.customer.update({ where: { id }, data }); }
	list(filter: any, skip: number, limit: number) { return prisma.customer.findMany({ where: filter, orderBy: { createdAt: 'desc' }, skip, take: limit }); }
	count(filter: any) { return prisma.customer.count({ where: filter }); }
}

export default new CustomerRepository();
