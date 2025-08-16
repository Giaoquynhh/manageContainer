import Header from '@components/Header';
import Card from '@components/Card';
import { useState } from 'react';
import useSWR from 'swr';
import { reportsApi, ReportFilters } from '@services/reports';

export default function ReportsDashboard(){
  const [filters, setFilters] = useState<ReportFilters>({});
  const key = ['reports_dashboard', JSON.stringify(filters)].join(':');
  const { data } = useSWR(key, async ()=> reportsApi.getDashboard(filters));

  const download = async (type: string, format: 'csv'|'pdf') => {
    const blob = await reportsApi.exportFile(type, format, `${type}_${Date.now()}`, filters);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${type}.${format}`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid" style={{gap:16}}>
          <Card title="Bộ lọc">
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
              <input type="date" value={filters.from || ''} onChange={e=>setFilters(f=>({...f, from: e.target.value||undefined}))} />
              <input type="date" value={filters.to || ''} onChange={e=>setFilters(f=>({...f, to: e.target.value||undefined}))} />
              <input placeholder="customer_id (optional)" value={filters.customer_id || ''} onChange={e=>setFilters(f=>({...f, customer_id: e.target.value||undefined}))} />
            </div>
          </Card>

          <Card title="Revenue by day">
            <div style={{display:'flex', gap:8, marginBottom:8}}>
              <button className="btn" onClick={()=>download('revenue_by_day','csv')}>Export CSV</button>
              <button className="btn" onClick={()=>download('revenue_by_day','pdf')}>Export PDF</button>
            </div>
            <table className="table">
              <thead><tr><th>Ngày</th><th>Doanh thu</th></tr></thead>
              <tbody>
                {(data?.revenue_by_day||[]).map((r:any)=>(<tr key={r.day}><td>{r.day}</td><td>{Number(r.revenue||0).toLocaleString('vi-VN')}</td></tr>))}
              </tbody>
            </table>
          </Card>

          <Card title="Payments by day">
            <div style={{display:'flex', gap:8, marginBottom:8}}>
              <button className="btn" onClick={()=>download('payments_by_day','csv')}>Export CSV</button>
              <button className="btn" onClick={()=>download('payments_by_day','pdf')}>Export PDF</button>
            </div>
            <table className="table">
              <thead><tr><th>Ngày</th><th>Thu</th></tr></thead>
              <tbody>
                {(data?.payments_by_day||[]).map((r:any)=>(<tr key={r.day}><td>{r.day}</td><td>{Number(r.amount||0).toLocaleString('vi-VN')}</td></tr>))}
              </tbody>
            </table>
          </Card>

          <Card title="Requests status">
            <table className="table">
              <thead><tr><th>Trạng thái</th><th>Số lượng</th></tr></thead>
              <tbody>
                {(data?.requests_status||[]).map((r:any)=>(<tr key={r.status}><td>{r.status}</td><td>{r.count}</td></tr>))}
              </tbody>
            </table>
          </Card>

          <Card title="Yard utilization">
            <div>Tổng slot: {data?.yard_utilization?.total || 0}</div>
            <div>Đang sử dụng: {data?.yard_utilization?.occupied || 0}</div>
            <div>Tỷ lệ: {data?.yard_utilization?.utilization || 0}%</div>
          </Card>

          <Card title="Forklift productivity">
            <table className="table">
              <thead><tr><th>Trạng thái</th><th>Số lượng</th></tr></thead>
              <tbody>
                {(data?.forklift_productivity||[]).map((r:any)=>(<tr key={r.status}><td>{r.status}</td><td>{r.count}</td></tr>))}
              </tbody>
            </table>
          </Card>

          <Card title="AR Aging (tổng hợp)">
            <pre>{JSON.stringify(data?.ar_aging||{}, null, 2)}</pre>
          </Card>
        </div>
      </main>
    </>
  );
}


