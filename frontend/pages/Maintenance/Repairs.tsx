import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useEffect, useState } from 'react';

export default function RepairsPage(){
  const [filter, setFilter] = useState<string>('PENDING_APPROVAL');
  const key = ['repairs', filter].join(':');
  const { data: repairs } = useSWR(key, async ()=> maintenanceApi.listRepairs(filter||undefined));
  const { data: equipments } = useSWR('equipments', async ()=> maintenanceApi.listEquipments());
  const [form, setForm] = useState<any>({ code: '', equipment_id: '', problem_description: '', estimated_cost: 0, items: [] as any[] });
  const [costStr, setCostStr] = useState<string>('0');
  const [msg, setMsg] = useState('');

  const fmt = (n: any) => {
    const num = Number(n || 0);
    return num.toLocaleString('vi-VN');
  };

  useEffect(()=>{ if (!form.equipment_id && equipments?.[0]) setForm((f:any)=>({ ...f, equipment_id: equipments[0].id })); }, [equipments]);

  const submit = async () => {
    setMsg('');
    try{
      const payload = { ...form, estimated_cost: Number(costStr) };
      await maintenanceApi.createRepair(payload);
      setMsg('Đã tạo phiếu');
      setForm({ code: '', equipment_id: form.equipment_id, problem_description: '', estimated_cost: 0, items: [] });
      setCostStr('0');
      mutate(key);
    }
    catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi tạo phiếu'); }
  };
  const approve = async (id: string) => { setMsg(''); try{ await maintenanceApi.approveRepair(id); mutate(key); setMsg('Đã duyệt'); }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi duyệt'); } };
  const reject = async (id: string) => { setMsg(''); try{ const c = window.prompt('Lý do từ chối?') || undefined; await maintenanceApi.rejectRepair(id, c); mutate(key); setMsg('Đã từ chối'); }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi từ chối'); } };

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid grid-cols-2" style={{gap:16}}>
          <Card title="Danh sách phiếu sửa chữa">
            <div style={{display:'flex', gap:8, marginBottom:8}}>
              <select value={filter} onChange={e=>{ setFilter(e.target.value); mutate(key); }}>
                <option value="">Tất cả</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <table className="table">
              <thead><tr><th>Mã</th><th>Thiết bị</th><th>Trạng thái</th><th>Mô tả</th><th style={{textAlign:'right'}}>Chi phí (đ)</th><th>Hành động</th></tr></thead>
              <tbody>
                {(repairs||[]).map((r:any)=> (
                  <tr key={r.id}>
                    <td>{r.code}</td>
                    <td>{r.equipment?.code}</td>
                    <td>{r.status}</td>
                    <td title={r.problem_description}>{r.problem_description || '-'}</td>
                    <td style={{textAlign:'right'}}>{fmt(r.estimated_cost)}</td>
                    <td style={{display:'flex', gap:6}}>
                      {r.status==='PENDING_APPROVAL' && <>
                        <button className="btn" onClick={()=>approve(r.id)}>Duyệt</button>
                        <button className="btn" onClick={()=>reject(r.id)}>Từ chối</button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="Tạo phiếu">
            <div className="grid" style={{gap:10}}>
              <label style={{fontSize:12,color:'#475569'}}>Mã phiếu</label>
              <input value={form.code} onChange={e=>setForm({...form, code:e.target.value})} />
              <label style={{fontSize:12,color:'#475569'}}>Thiết bị</label>
              <select value={form.equipment_id} onChange={e=>setForm({...form, equipment_id:e.target.value})}>
                {equipments?.map((e:any)=>(<option key={e.id} value={e.id}>{e.code}</option>))}
              </select>
              <label style={{fontSize:12,color:'#475569'}}>Mô tả lỗi</label>
              <textarea value={form.problem_description} onChange={e=>setForm({...form, problem_description:e.target.value})} />
              <label style={{fontSize:12,color:'#475569'}}>Chi phí dự toán</label>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <input value={costStr} onChange={e=>setCostStr(e.target.value)} />
                <span style={{fontSize:14,color:'#334155'}}>đồng</span>
              </div>
              <button className="btn" onClick={submit}>Tạo phiếu</button>
              {msg && <div style={{fontSize:12, color:'#1e3a8a'}}>{msg}</div>}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}


