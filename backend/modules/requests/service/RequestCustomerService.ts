import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';
import RequestStateMachine from './RequestStateMachine';

export class RequestCustomerService {
	/**
	 * Customer accept request
	 */
	async acceptRequest(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Validate transition using State Machine
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'ACCEPT'
		);

		const updateData = {
			status: 'ACCEPT',
			history: [
				...(Array.isArray(req.history) ? req.history : []),
				{
					at: new Date().toISOString(),
					by: actor._id,
					action: 'ACCEPTED_BY_CUSTOMER'
				}
			]
		};

		const updated = await repo.update(id, updateData);
		await audit(actor._id, 'REQUEST.ACCEPTED_BY_CUSTOMER', 'ServiceRequest', id);
		
		// Đồng bộ trạng thái RepairTicket nếu có container_no
		if (req.container_no) {
			try {
				const maintenanceService = await import('../../maintenance/service/MaintenanceService');
				await maintenanceService.default.syncRepairTicketStatus(req.container_no);
				console.log('✅ Successfully synced RepairTicket status for container:', req.container_no);
			} catch (error) {
				console.error('❌ Error syncing RepairTicket status:', error);
				// Không throw error để không ảnh hưởng đến việc accept request
			}
		}
		
		return updated;
	}

	/**
	 * Customer accept scheduled request (SCHEDULED -> FORWARDED)
	 */
	async acceptScheduledRequest(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Kiểm tra trạng thái hiện tại
		if (req.status !== 'SCHEDULED') {
			throw new Error('Chỉ có thể chấp nhận yêu cầu đã được lên lịch hẹn');
		}

		// Kiểm tra quyền tenant
		if (req.tenant_id !== actor.tenant_id) {
			throw new Error('Không có quyền chấp nhận yêu cầu này');
		}

		// Validate transition using State Machine
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'FORWARDED',
			'Khách hàng chấp nhận yêu cầu đã lên lịch hẹn'
		);

		const updateData = {
			status: 'FORWARDED',
			forwarded_at: new Date(),
			forwarded_by: actor._id,
			history: [
				...(Array.isArray(req.history) ? req.history : []),
				{
					at: new Date().toISOString(),
					by: actor._id,
					action: 'ACCEPTED_SCHEDULED_BY_CUSTOMER',
					reason: 'Khách hàng chấp nhận yêu cầu đã lên lịch hẹn'
				}
			]
		};

		const updated = await repo.update(id, updateData);
		await audit(actor._id, 'REQUEST.ACCEPTED_SCHEDULED_BY_CUSTOMER', 'ServiceRequest', id);
		
		return updated;
	}

	/**
	 * Customer reject request
	 */
	async rejectByCustomer(actor: any, id: string, reason: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		if (!reason || reason.trim() === '') throw new Error('Lý do từ chối là bắt buộc');

		// Validate transition using State Machine
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'REJECTED',
			reason
		);

		const updateData = {
			status: 'REJECTED',
			rejected_reason: reason,
			rejected_by: actor._id,
			rejected_at: new Date(),
			history: [
				...(Array.isArray(req.history) ? req.history : []),
				{
					at: new Date().toISOString(),
					by: actor._id,
					action: 'REJECTED_BY_CUSTOMER',
					reason
				}
			]
		};

		const updated = await repo.update(id, updateData);
		await audit(actor._id, 'REQUEST.REJECTED_BY_CUSTOMER', 'ServiceRequest', id, { reason });
		return updated;
	}
}

export default new RequestCustomerService();
