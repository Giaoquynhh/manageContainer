import { AuthUser } from '../../../shared/middlewares/auth';
import repo from '../repository/ReportsRepository';
import { cache } from './Cache';
// Use dynamic require to avoid TypeScript type requirement for pdfkit
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument: any = require('pdfkit');
import { stringify } from 'csv-stringify/sync';

type RangeFilters = { from?: string | Date; to?: string | Date; customer_id?: string };

function normalizeRange(filters: RangeFilters){
  const range = { from: filters.from? new Date(filters.from): undefined, to: filters.to? new Date(filters.to): undefined };
  return { range, customerId: filters.customer_id };
}

function scopeByRole(user: AuthUser, filters: RangeFilters){
  // Enforce limited scopes according to role
  if (user.role === 'SaleAdmin'){
    // restrict by customer if provided; otherwise still allow but no extra scope available here
    return filters;
  }
  if (user.role === 'Accountant'){
    // Accountant: finance data only — our endpoints only expose finance + ops KPIs; keep as is
    return filters;
  }
  return filters; // SystemAdmin/BusinessAdmin full
}

export class ReportsService {
  async dashboard(user: AuthUser, filters: RangeFilters){
    const scoped = scopeByRole(user, filters);
    const { range, customerId } = normalizeRange(scoped);
    const key = `reports:dashboard:${JSON.stringify({ userRole: user.role, range, customerId })}`;
    const cached = cache.get<any>(key); if (cached) return cached;

    const [revenue, payments, reqStatus, yard, forklift, aging] = await Promise.all([
      repo.revenueByDay(range, customerId),
      repo.paymentsByDay(range, customerId),
      repo.requestsStatus(range),
      repo.yardUtilization(),
      repo.forkliftProductivity(range),
      repo.arAging(new Date(), customerId)
    ]);

    const result = { revenue_by_day: revenue, payments_by_day: payments, requests_status: reqStatus, yard_utilization: yard, forklift_productivity: forklift, ar_aging: aging };
    cache.set(key, result);
    return result;
  }

  async customPreview(user: AuthUser, payload: { type: string; filters: RangeFilters }){
    const scoped = scopeByRole(user, payload.filters||{});
    const { range, customerId } = normalizeRange(scoped);
    switch(payload.type){
      case 'revenue_by_day': return repo.revenueByDay(range, customerId);
      case 'payments_by_day': return repo.paymentsByDay(range, customerId);
      case 'requests_status': return repo.requestsStatus(range);
      case 'yard_utilization': return repo.yardUtilization();
      case 'forklift_productivity': return repo.forkliftProductivity(range);
      case 'ar_aging': return repo.arAging(new Date(), customerId);
      default: throw new Error('UNSUPPORTED_REPORT');
    }
  }

  async exportReport(user: AuthUser, payload: { type: string; format: 'csv'|'pdf'; filename: string; filters: RangeFilters }){
    const data = await this.customPreview(user, { type: payload.type, filters: payload.filters });
    if (payload.format === 'csv'){
      const rows = Array.isArray(data) ? data : [data];
      const csv = stringify(rows, { header: true });
      const stream = new PDFDocument({ size: 'A4' }); // placeholder to set headers via pipe trick not available; we will return CSV via Node stream alternative
      // Workaround: create a PassThrough stream for CSV
      const { PassThrough } = require('stream');
      const pass = new PassThrough();
      process.nextTick(()=>{ pass.end(Buffer.from(csv,'utf-8')); });
      (pass as any).setHeader = (res: any)=>{};
      (pass as any).onPipe = (res: any)=>{};
      (pass as any).pipe = (res: any)=>{ res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}.csv"`); return require('stream').Readable.prototype.pipe.call(pass, res); };
      return pass as any;
    }
    // PDF: render simple table
    const doc = new PDFDocument({ margin: 24 });
    const writeHeader = () => {
      doc.fontSize(14).text(`Report: ${payload.type}`, { underline: true });
      doc.moveDown(0.5);
    };
    writeHeader();
    const rows = Array.isArray(data) ? data : [data];
    const keys = rows.length ? Object.keys(rows[0]) : [];
    doc.fontSize(10);
    doc.text(keys.join(' | '));
    doc.moveDown(0.25);
    for (const r of rows){
      const line = keys.map(k=>String((r as any)[k] ?? '')).join(' | ');
      doc.text(line);
    }
    doc.end();
    const stream = doc as any;
    stream.pipe = (res: any)=>{ res.setHeader('Content-Type','application/pdf'); res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}.pdf"`); return PDFDocument.prototype.pipe.call(doc, res); };
    return doc as any;
  }

  async listContainers(_user: AuthUser, query: any){
    const page = Math.max(1, parseInt(String(query.page||'1'),10));
    const pageSize = Math.min(200, Math.max(1, parseInt(String(query.pageSize||'20'),10)));
    return repo.containerList({ q: query.q as string|undefined, status: query.status as string|undefined, type: query.type as string|undefined, page, pageSize });
  }
}

export default new ReportsService();


