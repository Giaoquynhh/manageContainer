import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';
import { prisma } from '../../../shared/config/database';
import RequestStateMachine from './RequestStateMachine';

export class RequestCrudService {
	/**
	 * Cập nhật trạng thái request
	 */
	async updateStatus(actor: any, id: string, status: string, reason?: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Sử dụng State Machine để validate và execute transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			status,
			reason
		);

		const prevHistory = Array.isArray(req.history) ? (req.history as any[]) : [];
		const updateData: any = {
			status,
			history: [
				...prevHistory,
				{ at: new Date().toISOString(), by: actor._id, action: status, reason }
			]
		};
		
		// Nếu reject, lưu thông tin reject
		if (status === 'REJECTED') {
			updateData.rejected_reason = reason;
			updateData.rejected_by = actor._id;
			updateData.rejected_at = new Date();
		}
		
		const updated = await repo.update(id, updateData);
		return updated;
	}

	/**
	 * Cập nhật container number
	 */
	async updateContainerNo(actor: any, id: string, containerNo: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Kiểm tra quyền - chỉ depot admin mới có thể cập nhật container_no
		if (!['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(actor.role)) {
			throw new Error('Không có quyền cập nhật container_no');
		}

		// Kiểm tra trạng thái - chỉ có thể cập nhật khi request đang PENDING
		if (req.status !== 'PENDING') {
			throw new Error('Chỉ có thể cập nhật container_no khi request đang ở trạng thái PENDING');
		}

		// Kiểm tra container đã được sử dụng bởi request khác chưa
		const existingRequest = await prisma.serviceRequest.findFirst({
			where: {
				container_no: containerNo,
				is_pick: true,
				status: { not: 'REJECTED' },
				id: { not: id }
			}
		});

		if (existingRequest) {
			throw new Error(`Container ${containerNo} đã được sử dụng bởi request khác`);
		}

		const prevHistory = Array.isArray(req.history) ? (req.history as any[]) : [];
		const updated = await repo.update(id, {
			container_no: containerNo,
			is_pick: true, // Đánh dấu đã chọn container
			history: [
				...prevHistory,
				{ at: new Date().toISOString(), by: actor._id, action: 'CONTAINER_ASSIGNED', reason: `Container ${containerNo} được gán` }
			]
		});

		await audit(actor._id, 'REQUEST.CONTAINER_ASSIGNED', 'ServiceRequest', id, { container_no: containerNo });
		
		return updated;
	}

	/**
	 * Lấy danh sách container available cho EXPORT request
	 */
	async getAvailableContainersForExport(actor: any, searchQuery?: string) {
		// Kiểm tra quyền
		if (!['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(actor.role)) {
			throw new Error('Không có quyền xem danh sách container');
		}

		// Lấy danh sách container từ YardPlacement (container đã được đặt trong bãi)
		const containers = await prisma.yardPlacement.findMany({
			where: {
				status: 'OCCUPIED',
				container_no: { not: null },
				...(searchQuery && {
					container_no: {
						contains: searchQuery,
						mode: 'insensitive'
					}
				})
			},
			include: {
				slot: {
					include: {
						block: {
							include: {
								yard: true
							}
						}
					}
				}
			},
			orderBy: {
				placed_at: 'desc'
			}
		});

		// Lọc bỏ container đã được sử dụng bởi request khác
		const availableContainers = [];
		for (const placement of containers) {
			if (!placement.container_no) continue;

			// Kiểm tra container có đang được sử dụng bởi request khác không
			const existingRequest = await prisma.serviceRequest.findFirst({
				where: {
					container_no: placement.container_no,
					is_pick: true,
					status: { not: 'REJECTED' }
				}
			});

			if (!existingRequest) {
				availableContainers.push({
					container_no: placement.container_no,
					location: `${placement.slot.block.yard.name} / ${placement.slot.block.code} / ${placement.slot.code}`,
					status: 'Container rỗng có trong bãi',
					placed_at: placement.placed_at
				});
			}
		}

		return availableContainers;
	}

	/**
	 * Soft delete request
	 */
	async softDeleteRequest(actor: any, id: string, scope: 'depot' | 'customer') {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		
		// Kiểm tra quyền theo scope
		if (scope === 'depot') {
			if (!['SaleAdmin', 'SystemAdmin', 'Accountant'].includes(actor.role)) {
				throw new Error('Không có quyền xóa request khỏi depot');
			}
			// Depot chỉ có thể xóa REJECTED, COMPLETED, EXPORTED
			if (!['REJECTED', 'COMPLETED', 'EXPORTED'].includes(req.status)) {
				throw new Error('Depot chỉ có thể xóa request đã reject, completed hoặc exported');
			}
		} else if (scope === 'customer') {
			if (!['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
				throw new Error('Không có quyền xóa request khỏi customer');
			}
			// Customer chỉ có thể xóa REJECTED
			if (req.status !== 'REJECTED') {
				throw new Error('Customer chỉ có thể xóa request đã reject');
			}
			// Kiểm tra tenant
			if (req.tenant_id !== actor.tenant_id) {
				throw new Error('Không có quyền xóa request của tenant khác');
			}
		}
		
		await repo.softDelete(id, scope);
		await audit(actor._id, 'REQUEST.DELETED', 'ServiceRequest', id, { scope });
		
		return { 
			ok: true, 
			id, 
			scope, 
			deleted_at: new Date().toISOString() 
		};
	}

	/**
	 * Restore request
	 */
	async restoreRequest(actor: any, id: string, scope: 'depot' | 'customer') {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		
		// Kiểm tra quyền theo scope
		if (scope === 'depot') {
			if (!['SaleAdmin', 'SystemAdmin', 'Accountant'].includes(actor.role)) {
				throw new Error('Không có quyền khôi phục request trong depot');
			}
		} else if (scope === 'customer') {
			if (!['CustomerAdmin', 'CustomerUser'].includes(actor.role)) {
				throw new Error('Không có quyền khôi phục request trong customer');
			}
			// Kiểm tra tenant
			if (req.tenant_id !== actor.tenant_id) {
				throw new Error('Không có quyền khôi phục request của tenant khác');
			}
		}
		
		await repo.restore(id, scope);
		await audit(actor._id, 'REQUEST.RESTORED', 'ServiceRequest', id, { scope });
		
		return { 
			ok: true, 
			id, 
			scope, 
			restored_at: new Date().toISOString() 
		};
	}
}

export default new RequestCrudService();
