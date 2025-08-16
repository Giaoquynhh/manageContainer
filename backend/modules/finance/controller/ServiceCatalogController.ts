import { Request, Response } from 'express';

type ServiceCatalogItem = {
	code: string;
	name: string;
	default_description?: string;
	default_unit_price?: number;
	tax_rate?: number;
};

// Temporary in-memory catalog. In a future phase, move to DB and price lists per org/customer.
export const catalogServices: ServiceCatalogItem[] = [
	{ code: 'GATE_IN', name: 'Gate In', default_description: 'Dịch vụ cổng vào', default_unit_price: 100000, tax_rate: 10 },
	{ code: 'GATE_OUT', name: 'Gate Out', default_description: 'Dịch vụ cổng ra', default_unit_price: 100000, tax_rate: 10 },
	{ code: 'LOLO', name: 'Nâng/Hạ container (LO/LO)', default_description: 'Nâng/Hạ container', default_unit_price: 150000, tax_rate: 10 },
	{ code: 'STORAGE_DAY', name: 'Lưu bãi theo ngày', default_description: 'Phí lưu bãi theo ngày', default_unit_price: 50000, tax_rate: 10 },
	{ code: 'CLEANING', name: 'Vệ sinh container', default_description: 'Vệ sinh tiêu chuẩn', default_unit_price: 80000, tax_rate: 10 }
];

class ServiceCatalogController {
	async listServices(_req: Request, res: Response){
		return res.json(catalogServices);
	}
}

export default new ServiceCatalogController();


