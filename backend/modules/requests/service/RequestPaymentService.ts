import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';

export class RequestPaymentService {
	/**
	 * Send payment request
	 */
	async sendPaymentRequest(actor: any, request_id: string) {
		const req = await repo.findById(request_id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		if (req.status !== 'COMPLETED') throw new Error('Chỉ gửi yêu cầu thanh toán khi yêu cầu đã hoàn tất');
		const pr = await repo.createPayment({ request_id, created_by: actor._id, status: 'SENT' });
		await audit(actor._id, 'PAYMENT.SENT', 'ServiceRequest', request_id);
		return pr;
	}
}

export default new RequestPaymentService();
