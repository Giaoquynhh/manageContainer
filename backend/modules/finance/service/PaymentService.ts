import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

function r2(n: number){ return Math.round(n*100)/100; }

export class PaymentService {
  async create(actor: any, payload: any, idempotencyKey?: string){
    if (idempotencyKey) {
      const exists = await prisma.payment.findFirst({ where: { idempotency_key: idempotencyKey } });
      if (exists) return exists;
    }
    const sumAlloc = r2((payload.allocations||[]).reduce((s: number,a: any)=>s + Number(a.allocated_amount||0), 0));
    if (sumAlloc !== r2(Number(payload.amount))) throw new Error('INVALID_ALLOCATION');
    const result = await prisma.$transaction(async (tx)=>{
      const seq = Date.now()%100000; const ym = new Date(payload.paid_date).toISOString().slice(0,7).replace('-','');
      const pay = await tx.payment.create({ data: {
        org_id: actor.org_id || null,
        payment_no: `PAY-${ym}-${String(seq).padStart(5,'0')}`,
        customer_id: payload.customer_id,
        amount: payload.amount as any,
        currency: payload.currency || 'VND',
        paid_date: new Date(payload.paid_date),
        method: payload.method,
        reference_no: payload.reference_no || null,
        notes: payload.notes || null,
        idempotency_key: idempotencyKey || null,
        created_by: actor._id
      }});
      for (const a of payload.allocations){
        const inv = await tx.invoice.findUnique({ where: { id: a.invoice_id } });
        if (!inv) throw new Error('INVOICE_NOT_FOUND');
        const outstanding = r2(Number(inv.total_amount) - Number(inv.paid_total));
        if (Number(a.allocated_amount) > outstanding) throw new Error('INVALID_ALLOCATION');
        await tx.paymentAllocation.create({ data: {
          org_id: actor.org_id || null,
          payment_id: pay.id,
          invoice_id: inv.id,
          allocated_amount: a.allocated_amount as any
        }});
        const newPaid = r2(Number(inv.paid_total) + Number(a.allocated_amount));
        let status = 'UNPAID';
        if (newPaid === 0) status='UNPAID'; else if (newPaid < Number(inv.total_amount)) status='PARTIALLY_PAID'; else status='PAID';
        await tx.invoice.update({ where: { id: inv.id }, data: { paid_total: newPaid as any, status, paid_at: status==='PAID'? new Date(): inv.paid_at, version: inv.version + 1 } });
      }
      return pay;
    });
    await audit(actor._id, 'PAYMENT.CREATED', 'FINANCE', result.id);
    return result;
  }

  async list(actor: any, query: any){
    const where: any = {};
    if (query.customer_id) where.customer_id = query.customer_id;
    if (query.from || query.to) where.paid_date = { gte: query.from? new Date(query.from): undefined, lte: query.to? new Date(query.to): undefined };
    return prisma.payment.findMany({ where, orderBy: { paid_date: 'desc' } });
  }
}

export default new PaymentService();



