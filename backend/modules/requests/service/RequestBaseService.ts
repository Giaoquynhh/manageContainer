import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';
import { prisma } from '../../../shared/config/database';
import chatService from '../../chat/service/ChatService';

export class RequestBaseService {
	/**
	 * Tạo request mới bởi customer
	 */
	async createByCustomer(actor: any, payload: { type: string; container_no?: string; eta?: Date }, files?: Express.Multer.File[]) {
		// Kiểm tra logic business: IMPORT cần container_no và files, EXPORT chỉ cần ETA
		if (payload.type === 'IMPORT') {
			if (!payload.container_no) {
				throw new Error('Mã định danh container là bắt buộc cho yêu cầu nhập');
			}
			if (!files || files.length === 0) {
				throw new Error('Chứng từ là bắt buộc cho yêu cầu nhập');
			}
			
			// Kiểm tra container number đã tồn tại trong hệ thống chưa
			await this.validateContainerNotExists(payload.container_no);
		}

		const data = {
			tenant_id: actor.tenant_id || null,
			created_by: actor._id,
			type: payload.type,
			container_no: payload.container_no || null, // Có thể null cho EXPORT
			eta: payload.eta || null,
			status: 'PENDING',
			history: [{ at: new Date().toISOString(), by: actor._id, action: 'CREATE' }]
		};
		const req = await repo.create(data);
		
		await audit(actor._id, 'REQUEST.CREATED', 'ServiceRequest', req.id);
		
		// Tự động tạo chat room cho request mới
		try {
			await chatService.createChatRoom(actor, req.id);
		} catch (error) {
			console.error('Không thể tạo chat room:', error);
		}
		
		return req;
	}

	/**
	 * Tạo request bởi Sale Admin
	 */
	async createBySaleAdmin(actor: any, payload: any) {
		const req = await repo.create({ 
			...payload, 
			created_by: actor._id, 
			status: 'SCHEDULED', 
			history: [{ at: new Date().toISOString(), by: actor._id, action: 'SCHEDULED' }] 
		});
		await audit(actor._id, 'REQUEST.SCHEDULED', 'ServiceRequest', req.id);
		return req;
	}

	/**
	 * Lấy request theo ID với kiểm tra quyền
	 */
	async getById(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		
		// Kiểm tra quyền truy cập
		if (actor.tenant_id && (actor.role === 'CustomerAdmin' || actor.role === 'CustomerUser')) {
			if (req.tenant_id !== actor.tenant_id) {
				throw new Error('Không có quyền truy cập yêu cầu này');
			}
		}
		
		return req;
	}

	/**
	 * Lấy danh sách requests với filter và pagination
	 */
	async list(actor: any, query: any) {
		const filter: any = {};
		if (query.type) filter.type = query.type;
		if (query.status) filter.status = query.status;
		
		// Xác định actor type để filter soft-delete
		let actorType: 'depot' | 'customer' | undefined;
		if (['SaleAdmin', 'SystemAdmin', 'Accountant'].includes(actor.role)) {
			actorType = 'depot';
		} else if (['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
			actorType = 'customer';
		}
		
		// Scope: Customer chỉ xem tenant của mình; Accountant/SaleAdmin xem tất cả
		if (actor.tenant_id && (actor.role === 'CustomerAdmin' || actor.role === 'CustomerUser')) {
			filter.tenant_id = actor.tenant_id;
		}
		
		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;
		const includeHidden = query.includeHidden === 'true';
		
		const [data, total] = await Promise.all([
			repo.list(filter, skip, limit, actorType, includeHidden), 
			repo.count(filter, actorType, includeHidden)
		]);
		
		// Gắn thông tin payment mới nhất và documents để FE hiển thị
		const withPaymentAndDocs = await Promise.all(
			data.map(async (r: any) => {
				const [pay, docs] = await Promise.all([
					repo.getLatestPayment(r.id),
					repo.listDocs(r.id)
				]);
				return { 
					...r, 
					latest_payment: pay || null,
					documents: docs || []
				};
			})
		);
		return { data: withPaymentAndDocs, total, page, totalPages: Math.ceil(total / limit) };
	}

	/**
	 * Kiểm tra container number chưa tồn tại trong hệ thống
	 * Chỉ cho phép tạo request import mới khi container thực sự không có trong depot
	 * Kiểm tra tất cả nguồn: ServiceRequest, RepairTicket, YardPlacement
	 */
	private async validateContainerNotExists(container_no: string) {
		// Sử dụng query tương tự như logic hiển thị container trong Yard/ContainersPage
		const containerExists = await prisma.$queryRaw<any[]>`
			WITH latest_sr AS (
				SELECT DISTINCT ON (sr.container_no)
					sr.container_no,
					sr.status as service_status,
					sr.gate_checked_at as gate_checked_at,
					sr.type as request_type
				FROM "ServiceRequest" sr
				WHERE sr.container_no IS NOT NULL
				ORDER BY sr.container_no, sr."createdAt" DESC
			),
			rt_checked AS (
				SELECT DISTINCT ON (rt.container_no)
					rt.container_no,
					TRUE as repair_checked,
					rt."updatedAt" as updated_at
				FROM "RepairTicket" rt
				WHERE rt.status::text = 'CHECKED' AND rt.container_no IS NOT NULL
				ORDER BY rt.container_no, rt."updatedAt" DESC
			),
			yard_placement AS (
				SELECT DISTINCT ON (yp.container_no)
					yp.container_no,
					yp.status as placement_status,
					yp.placed_at
				FROM "YardPlacement" yp 
				WHERE yp.status = 'OCCUPIED' 
					AND yp.removed_at IS NULL
					AND yp.container_no IS NOT NULL
				ORDER BY yp.container_no, yp.placed_at DESC
			)
			SELECT 
				COALESCE(sr.container_no, rt.container_no, yp.container_no) as container_no,
				sr.service_status,
				sr.gate_checked_at,
				sr.request_type,
				COALESCE(rt.repair_checked, FALSE) as repair_checked,
				yp.placement_status,
				yp.placed_at,
				CASE 
					WHEN sr.container_no IS NOT NULL THEN 'SERVICE_REQUEST'
					WHEN rt.container_no IS NOT NULL THEN 'REPAIR_TICKET'
					WHEN yp.container_no IS NOT NULL THEN 'YARD_PLACEMENT'
				END as source
			FROM latest_sr sr
			FULL OUTER JOIN rt_checked rt ON rt.container_no = sr.container_no
			FULL OUTER JOIN yard_placement yp ON yp.container_no = COALESCE(sr.container_no, rt.container_no)
			WHERE sr.container_no = ${container_no} 
				OR rt.container_no = ${container_no} 
				OR yp.container_no = ${container_no}
		`;

		if (containerExists.length === 0) {
			// Container không tồn tại trong hệ thống - cho phép tạo
			return;
		}

		const container = containerExists[0];

		// Kiểm tra từng nguồn và đưa ra thông báo lỗi phù hợp
		if (container.source === 'SERVICE_REQUEST') {
			// Kiểm tra status của ServiceRequest
			const isCompleted = ['COMPLETED', 'REJECTED', 'GATE_REJECTED'].includes(container.service_status);
			if (!isCompleted) {
				throw new Error(`Container ${container_no} đã tồn tại trong hệ thống với trạng thái ${container.service_status}. Chỉ có thể tạo request mới khi container không còn trong hệ thống.`);
			}
		}

		if (container.source === 'REPAIR_TICKET') {
			// Container từ RepairTicket - không cho phép tạo request import
			throw new Error(`Container ${container_no} đang trong quy trình sửa chữa. Không thể tạo request import mới.`);
		}

		if (container.source === 'YARD_PLACEMENT') {
			// Container đã được đặt vào yard - không cho phép tạo request import
			throw new Error(`Container ${container_no} đã được đặt vào yard và chưa được xuất. Không thể tạo request import mới.`);
		}

		// Kiểm tra trường hợp container có trong nhiều nguồn
		const hasActiveServiceRequest = container.source === 'SERVICE_REQUEST' && 
			!['COMPLETED', 'REJECTED', 'GATE_REJECTED'].includes(container.service_status);
		const hasRepairTicket = container.source === 'REPAIR_TICKET';
		const hasYardPlacement = container.source === 'YARD_PLACEMENT';

		if (hasActiveServiceRequest) {
			throw new Error(`Container ${container_no} đã tồn tại trong hệ thống với trạng thái ${container.service_status}. Chỉ có thể tạo request mới khi container không còn trong hệ thống.`);
		}

		if (hasRepairTicket) {
			throw new Error(`Container ${container_no} đang trong quy trình sửa chữa. Không thể tạo request import mới.`);
		}

		if (hasYardPlacement) {
			throw new Error(`Container ${container_no} đã được đặt vào yard và chưa được xuất. Không thể tạo request import mới.`);
		}
	}
}

export default new RequestBaseService();
