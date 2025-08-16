import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

function r2(n: number){ return Math.round(n*100)/100; }
function r3(n: number){ return Math.round(n*1000)/1000; }
function r4(n: number){ return Math.round(n*10000)/10000; }

export class InvoiceService {
  calcTotals(items: Array<{ qty:number; unit_price:number; tax_rate?: number }>) {
    let subtotal = 0, tax = 0;
    for (const it of items){
      const qty = r3(it.qty);
      const price = r4(it.unit_price);
      const line = r2(qty * price);
      const taxAmt = it.tax_rate ? r2(line * (it.tax_rate/100)) : 0;
      subtotal += line; tax += taxAmt;
    }
    return { subtotal: r2(subtotal), tax_amount: r2(tax), total_amount: r2(subtotal+tax) };
  }

  async list(actor: any, query: any){
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.customer_id) where.customer_id = query.customer_id;
    if (query.from || query.to) where.issue_date = { gte: query.from? new Date(query.from): undefined, lte: query.to? new Date(query.to): undefined };
    const data = await prisma.invoice.findMany({ where, orderBy: { issue_date: 'desc' } });
    return data;
  }

  async create(actor: any, payload: any){
    const totals = this.calcTotals(payload.items);
    const inv = await prisma.invoice.create({ data: {
      org_id: actor.org_id || null,
      customer_id: payload.customer_id,
      currency: payload.currency || 'VND',
      issue_date: payload.issue_date ? new Date(payload.issue_date) : null,
      due_date: payload.due_date ? new Date(payload.due_date) : null,
      subtotal: totals.subtotal as any,
      tax_amount: totals.tax_amount as any,
      total_amount: totals.total_amount as any,
      notes: payload.notes || null,
      created_by: actor._id
    }});
    for (const it of payload.items){
      const qty = r3(it.qty); const price = r4(it.unit_price);
      const line = r2(qty*price); const taxAmt = it.tax_rate? r2(line*(it.tax_rate/100)) : 0; const totalLine = r2(line+taxAmt);
      await prisma.invoiceLineItem.create({ data: {
        org_id: actor.org_id || null,
        invoice_id: inv.id,
        service_code: it.service_code,
        description: it.description,
        qty: qty as any,
        unit_price: price as any,
        line_amount: line as any,
        tax_code: it.tax_code || null,
        tax_rate: (it.tax_rate ?? null) as any,
        tax_amount: taxAmt as any,
        total_line_amount: totalLine as any
      }});
    }
    await audit(actor._id, 'INVOICE.CREATED', 'FINANCE', inv.id);
    return inv;
  }

  async issue(actor: any, id: string, payload: { issue_date: string; due_date: string }){
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new Error('INVOICE_NOT_FOUND');
    if (inv.status !== 'DRAFT') throw new Error('INVALID_STATUS_TRANSITION');
    const issueDate = new Date(payload.issue_date);
    const ym = `${issueDate.getFullYear()}${String(issueDate.getMonth()+1).padStart(2,'0')}`;
    const seq = Date.now()%100000; // simple seq placeholder
    const invoice_no = `INV-ORG-${ym}-${String(seq).padStart(5,'0')}`;
    const updated = await prisma.invoice.update({ where: { id }, data: {
      issue_date: issueDate,
      due_date: new Date(payload.due_date),
      invoice_no,
      status: 'UNPAID'
    }});
    await audit(actor._id, 'INVOICE.ISSUED', 'FINANCE', id, { invoice_no });
    return updated;
  }

  async get(id: string){
    return prisma.invoice.findUnique({ where: { id }, include: { items: true, allocations: true } });
  }

  async patch(actor: any, id: string, payload: any){
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new Error('INVOICE_NOT_FOUND');
    if (inv.status !== 'UNPAID' && inv.status !== 'DRAFT') throw new Error('INVOICE_LOCKED');
    const updated = await prisma.invoice.update({ where: { id }, data: { due_date: payload.due_date? new Date(payload.due_date): inv.due_date, notes: payload.notes ?? inv.notes } });
    await audit(actor._id, 'INVOICE.UPDATED', 'FINANCE', id);
    return updated;
  }

  async cancel(actor: any, id: string){
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new Error('INVOICE_NOT_FOUND');
    if (inv.paid_total as any > 0 || inv.status !== 'UNPAID') throw new Error('INVALID_STATUS_TRANSITION');
    const updated = await prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
    await audit(actor._id, 'INVOICE.CANCELLED', 'FINANCE', id);
    return updated;
  }
}

export default new InvoiceService();



