import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';
import RequestStateMachine from './RequestStateMachine';
import appointmentService from './AppointmentService';

export class RequestStateService {
	/**
	 * Forward request từ Kho sang Gate
	 */
	async forwardToGate(actor: any, requestId: string) {
		const request = await repo.findById(requestId);
		if (!request) {
			throw new Error('Request không tồn tại');
		}

		if (request.status !== 'SCHEDULED') {
			throw new Error('Chỉ có thể forward request có trạng thái SCHEDULED');
		}

		const updatedRequest = await repo.update(requestId, {
			status: 'FORWARDED',
			forwarded_at: new Date(),
			forwarded_by: actor._id,
			history: [
				...(Array.isArray(request.history) ? request.history : []),
				{ at: new Date().toISOString(), by: actor._id, action: 'FORWARDED' }
			]
		});

		await audit(actor._id, 'REQUEST.FORWARDED', 'ServiceRequest', requestId);
		return updatedRequest;
	}

	/**
	 * Reject request
	 */
	async rejectRequest(actor: any, id: string, reason?: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		
		// Sử dụng State Machine để validate và execute transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'REJECTED',
			reason
		);
		
		const prevHistory = Array.isArray(req.history) ? (req.history as any[]) : [];
		const updated = await repo.update(id, {
			status: 'REJECTED',
			rejected_reason: reason || null,
			rejected_by: actor._id,
			rejected_at: new Date(),
			is_pick: false, // Reset is_pick khi reject để container có thể được sử dụng lại
			history: [
				...prevHistory,
				{ at: new Date().toISOString(), by: actor._id, action: 'REJECTED', reason }
			]
		});
		
		return updated;
	}

	/**
	 * Schedule request
	 */
	async scheduleRequest(actor: any, id: string, appointmentData: any) {
		return await appointmentService.scheduleAppointment(actor, id, appointmentData);
	}

	/**
	 * Update appointment
	 */
	async updateAppointment(actor: any, id: string, appointmentData: any) {
		return await appointmentService.updateAppointment(actor, id, appointmentData);
	}

	/**
	 * Add info to request
	 */
	async addInfoToRequest(actor: any, id: string, documents: any[], notes?: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Validate transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'SCHEDULED_INFO_ADDED'
		);

		const updateData: any = {
			status: 'SCHEDULED_INFO_ADDED',
			attachments_count: (req.attachments_count || 0) + documents.length,
			history: [
				...(Array.isArray(req.history) ? req.history : []),
				{
					at: new Date().toISOString(),
					by: actor._id,
					action: 'INFO_ADDED',
					documents_count: documents.length,
					notes
				}
			]
		};

		// Xử lý documents nếu có
		if (documents && documents.length > 0) {
			// TODO: Implement document upload logic
			console.log('Documents to be processed:', documents);
		}

		const updated = await repo.update(id, updateData);
		return updated;
	}

	/**
	 * Send to gate
	 */
	async sendToGate(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Validate transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'SENT_TO_GATE'
		);

		const updateData = {
			status: 'SENT_TO_GATE',
			history: [
				...(Array.isArray(req.history) ? req.history : []),
				{
					at: new Date().toISOString(),
					by: actor._id,
					action: 'SENT_TO_GATE'
				}
			]
		};

		const updated = await repo.update(id, updateData);
		return updated;
	}

	/**
	 * Complete request
	 */
	async completeRequest(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		// Validate transition
		await RequestStateMachine.executeTransition(
			actor,
			id,
			req.status,
			'COMPLETED'
		);

		const updateData = {
			status: 'COMPLETED',
			history: [
				...(Array.isArray(req.history) ? req.history : []),
				{
					at: new Date().toISOString(),
					by: actor._id,
					action: 'COMPLETED'
				}
			]
		};

		const updated = await repo.update(id, updateData);
		return updated;
	}

	/**
	 * Get valid transitions for a request
	 */
	async getValidTransitions(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');

		return RequestStateMachine.getValidTransitions(req.status, actor.role);
	}

	/**
	 * Get state info
	 */
	async getStateInfo(state: string) {
		return {
			state,
			description: RequestStateMachine.getStateDescription(state),
			color: RequestStateMachine.getStateColor(state)
		};
	}

	/**
	 * Get appointment info
	 */
	async getAppointmentInfo(id: string) {
		return await appointmentService.getAppointmentInfo(id);
	}
}

export default new RequestStateService();
