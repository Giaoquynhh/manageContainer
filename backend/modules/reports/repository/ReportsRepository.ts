import { prisma } from '../../../shared/config/database';

export type DateRange = { from?: Date; to?: Date };

function dateFilter(column: string, range: DateRange){
  const where: any = {};
  if (range.from || range.to){
    where[column] = { gte: range.from ?? undefined, lte: range.to ?? undefined };
  }
  return where;
}

export class ReportsRepository {
  async revenueByDay(range: DateRange, customerId?: string){
    // Sum revenue from issued invoices (UNPAID/PARTIALLY_PAID/PAID)
    const rows = await prisma.invoice.groupBy({
      by: ['issue_date'],
      where: {
        issue_date: { not: null, gte: range.from ?? undefined, lte: range.to ?? undefined },
        status: { in: ['UNPAID','PARTIALLY_PAID','PAID'] },
        customer_id: customerId ?? undefined as any
      },
      _sum: { total_amount: true }
    });
    return rows.filter(r=>r.issue_date).map(r=>({ day: (r.issue_date as Date).toISOString().slice(0,10), revenue: Number(r._sum.total_amount || 0) }));
  }

  async paymentsByDay(range: DateRange, customerId?: string){
    const rows = await prisma.payment.groupBy({
      by: ['paid_date'],
      where: { paid_date: { gte: range.from ?? undefined, lte: range.to ?? undefined }, customer_id: customerId ?? undefined as any },
      _sum: { amount: true }
    });
    return rows.map(r=>({ day: (r.paid_date as Date).toISOString().slice(0,10), amount: Number(r._sum.amount || 0) }));
  }

  async requestsStatus(range: DateRange){
    const rows = await prisma.serviceRequest.groupBy({
      by: ['status'],
      where: { createdAt: { gte: range.from ?? undefined, lte: range.to ?? undefined } },
      _count: { _all: true }
    });
    return rows.map(r=>({ status: r.status, count: r._count._all }));
  }

  async yardUtilization(){
    const total = await prisma.yardSlot.count();
    const occupied = await prisma.yardSlot.count({ where: { status: { in: ['OCCUPIED','RESERVED','UNDER_MAINTENANCE'] } } });
    return { total, occupied, utilization: total ? Math.round(occupied*10000/total)/100 : 0 };
  }

  async forkliftProductivity(range: DateRange){
    const rows = await prisma.forkliftTask.groupBy({
      by: ['status'],
      where: { createdAt: { gte: range.from ?? undefined, lte: range.to ?? undefined } },
      _count: { _all: true }
    });
    return rows.map(r=>({ status: r.status, count: r._count._all }));
  }

  async arAging(asOf: Date, customerId?: string){
    // Outstanding = total_amount - paid_total for issued invoices
    const invoices = await prisma.invoice.findMany({ where: { status: { in: ['UNPAID','PARTIALLY_PAID'] }, customer_id: customerId ?? undefined as any } });
    const buckets = { b0_30: 0, b31_60: 0, b61_90: 0, b90_plus: 0 } as Record<string, number>;
    for (const inv of invoices){
      if (!inv.issue_date) continue;
      const age = Math.floor((asOf.getTime() - new Date(inv.issue_date).getTime())/ (24*3600*1000));
      const outstanding = Number(inv.total_amount) - Number(inv.paid_total);
      if (outstanding <= 0) continue;
      if (age <= 30) buckets.b0_30 += outstanding; else if (age <= 60) buckets.b31_60 += outstanding; else if (age <= 90) buckets.b61_90 += outstanding; else buckets.b90_plus += outstanding;
    }
    return buckets;
  }

  async containerList(params: { q?: string; status?: string; type?: string; page: number; pageSize: number }){
    const where: any = {};
    if (params.q){ where.OR = [ { container_no: { contains: params.q, mode: 'insensitive' } } ]; }
    if (params.status){
      // status theo slot
      where.slotStatus = params.status;
    }
    // Join giữa ContainerMeta và vị trí hiện tại (YardSlot)
    const raw = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT cm.container_no,
             cm.dem_date, cm.det_date,
             ys.status as slot_status, ys.code as slot_code, yb.code as block_code, y.name as yard_name
      FROM "ContainerMeta" cm
      LEFT JOIN "YardSlot" ys ON ys."occupant_container_no" = cm.container_no
      LEFT JOIN "YardBlock" yb ON yb.id = ys.block_id
      LEFT JOIN "Yard" y ON y.id = yb.yard_id
      WHERE ($1::text IS NULL OR cm.container_no ILIKE '%'||$1||'%')
        AND ($2::text IS NULL OR ys.status = $2)
      ORDER BY cm.container_no
      LIMIT $3 OFFSET $4
      `,
      params.q ?? null,
      params.status ?? null,
      params.pageSize,
      (params.page-1) * params.pageSize
    );
    const total = (await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int as cnt FROM "ContainerMeta" cm LEFT JOIN "YardSlot" ys ON ys."occupant_container_no" = cm.container_no
       WHERE ($1::text IS NULL OR cm.container_no ILIKE '%'||$1||'%') AND ($2::text IS NULL OR ys.status = $2)`,
      params.q ?? null,
      params.status ?? null
    ))[0]?.cnt || 0;
    return { items: raw, total, page: params.page, pageSize: params.pageSize };
  }
}

export default new ReportsRepository();


