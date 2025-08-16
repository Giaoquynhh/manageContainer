import Header from '@components/Header';
import Card from '@components/Card';
import useSWR from 'swr';
import { useState } from 'react';
import { reportsApi } from '@services/reports';

export default function ReportContainers(){
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const key = ['report_containers', q, status, page].join(':');
  const { data, mutate } = useSWR(key, async ()=> reportsApi.listContainers({ q: q || undefined, status: status || undefined, page, pageSize }));

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid" style={{gap:16}}>
          <Card title="Danh sách container">
            <div style={{display:'grid', gridTemplateColumns:'1fr 220px', gap:12, marginBottom:12}}>
              <input placeholder="Tìm container_no" value={q} onChange={e=>{ setQ(e.target.value); setPage(1); mutate(); }} />
              <select value={status} onChange={e=>{ setStatus(e.target.value); setPage(1); mutate(); }}>
                <option value="">Tất cả trạng thái</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="RESERVED">RESERVED</option>
                <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
              </select>
            </div>
            <div style={{overflow:'hidden', borderRadius:12, border:'1px solid #e8eef6'}}>
            <table className="table">
              <thead style={{background:'#f7f9ff'}}><tr><th>Container</th><th>Yard</th><th>Block</th><th>Slot</th><th>Slot Status</th><th>DEM</th><th>DET</th></tr></thead>
              <tbody>
                {(data?.items||[]).map((it:any)=>(
                  <tr key={it.container_no}>
                    <td style={{fontWeight:700}}>{it.container_no}</td>
                    <td>{it.yard_name || '-'}</td>
                    <td>{it.block_code || '-'}</td>
                    <td>{it.slot_code || '-'}</td>
                    <td><span style={{background:'#eef2ff',color:'#0a2558',padding:'4px 8px',borderRadius:8,fontWeight:700}}>{it.slot_status || '-'}</span></td>
                    <td>{it.dem_date ? new Date(it.dem_date).toLocaleDateString() : '-'}</td>
                    <td>{it.det_date ? new Date(it.det_date).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12}}>
              <div className="muted">Tổng: {data?.total || 0}</div>
              <div style={{display:'flex', gap:8}}>
                <button className="btn" disabled={(data?.page||1)<=1} onClick={()=>{ setPage(p=>p-1); mutate(); }}>Prev</button>
                <div style={{alignSelf:'center'}}>Trang {data?.page||1} / {Math.max(1, Math.ceil((data?.total||0)/pageSize))}</div>
                <button className="btn" disabled={(data?.page||1) >= Math.ceil((data?.total||0)/pageSize)} onClick={()=>{ setPage(p=>p+1); mutate(); }}>Next</button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}


