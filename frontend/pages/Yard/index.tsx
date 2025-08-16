import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { yardApi } from '@services/yard';
import { forkliftApi } from '@services/forklift';
import { useState } from 'react';

const fetcher = async () => yardApi.map();

export default function YardPage(){
  const { data: map } = useSWR('yard_map', fetcher);
  const [q, setQ] = useState('');
  const [suggest, setSuggest] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // Forklift
  const [taskFilter, setTaskFilter] = useState<string>('');
  const tasksKey = ['forklift_tasks', taskFilter].join(':');
  const { data: tasks } = useSWR(tasksKey, async ()=> forkliftApi.list(taskFilter||undefined));
  const [assignForm, setAssignForm] = useState<{ container_no: string; from_slot_id: string; to_slot_id: string }>({ container_no: '', from_slot_id: '', to_slot_id: '' });

  const doSuggest = async ()=>{
    setMsg(''); setSuggest([]);
    try{ const data = await yardApi.suggest(q); setSuggest(data); }
    catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi'); }
  };
  const assign = async (slotId: string)=>{
    try{ await yardApi.assign(q, slotId); setMsg('Đã gán vị trí'); setSuggest([]); mutate('yard_map'); }
    catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi gán vị trí'); }
  };

  // Forklift actions
  const createTask = async () => {
    setMsg('');
    try{
      await forkliftApi.assign({ container_no: assignForm.container_no, from_slot_id: assignForm.from_slot_id || undefined, to_slot_id: assignForm.to_slot_id || undefined });
      mutate(tasksKey);
      setMsg('Đã tạo công việc xe nâng');
    }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi tạo task'); }
  };
  const updateTask = async (id: string, status: string) => {
    setMsg('');
    let reason: string|undefined;
    if (status==='CANCELLED') { try{ reason = window.prompt('Lý do hủy?') || undefined; }catch{} }
    try{
      await forkliftApi.updateStatus(id, status, reason);
      mutate(tasksKey);
      setMsg('Đã cập nhật công việc');
    }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi cập nhật task'); }
  };
  const short = (s?: string) => (s ? s.slice(0, 8) : '-');

  return (
    <>
      <Header />
      <main className="container">
        <div className="grid grid-cols-2" style={{gap:16}}>
          <Card title="Sơ đồ bãi (đơn giản)">
            {!map && <div>Đang tải…</div>}
            {map && map.map((yard:any)=> (
              <div key={yard.id} style={{marginBottom:16}}>
                <div style={{fontWeight:600}}>{yard.name}</div>
                {yard.blocks.map((b:any)=> (
                  <div key={b.id} style={{marginTop:8}}>
                    <div>{b.code}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                      {b.slots.map((s:any)=>{
                        const colors: any = { EMPTY:'#e2e8f0', RESERVED:'#fde68a', OCCUPIED:'#fca5a5', UNDER_MAINTENANCE:'#fdba74', EXPORT:'#d1fae5' };
                        return <div key={s.id} title={`${s.code} - ${s.status}`} style={{width:24,height:24,background:colors[s.status]||'#e2e8f0',borderRadius:4}}/>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </Card>
          <Card title="Gợi ý vị trí & Gán">
            <div className="grid" style={{gap:8}}>
              <input placeholder="Container No" value={q} onChange={e=>setQ(e.target.value)} />
              <button className="btn" onClick={doSuggest}>Gợi ý vị trí</button>
              <div>
                {suggest.map((it:any)=> (
                  <div key={it.slot.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <span>{it.slot.code} (score {it.score.toFixed(2)})</span>
                    <button className="btn" onClick={()=>assign(it.slot.id)}>Gán</button>
                  </div>
                ))}
              </div>
              {msg && <div style={{fontSize:12,color:'#1e3a8a'}}>{msg}</div>}
            </div>
          </Card>
          <Card title="Công việc xe nâng">
            <div className="grid" style={{gap:12}}>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <select value={taskFilter} onChange={e=>{ setTaskFilter(e.target.value); mutate(tasksKey); }}>
                  <option value="">Tất cả</option>
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <span style={{fontSize:12,color:'#475569'}}>Bộ lọc trạng thái</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Container</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {(tasks||[]).map((t:any)=> (
                    <tr key={t.id}>
                      <td>{t.container_no}</td>
                      <td title={t.from_slot_id || ''}>{short(t.from_slot_id)}</td>
                      <td title={t.to_slot_id || ''}>{short(t.to_slot_id)}</td>
                      <td>{t.status}</td>
                      <td style={{display:'flex', gap:6}}>
                        {t.status==='PENDING' && <button className="btn" onClick={()=>updateTask(t.id,'IN_PROGRESS')}>Start</button>}
                        {t.status==='IN_PROGRESS' && <button className="btn" onClick={()=>updateTask(t.id,'COMPLETED')}>Done</button>}
                        {t.status!=='COMPLETED' && t.status!=='CANCELLED' && <button className="btn" onClick={()=>updateTask(t.id,'CANCELLED')}>Cancel</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{borderTop:'1px solid #e2e8f0', paddingTop:8}}>
                <div style={{fontWeight:600, marginBottom:6}}>Tạo công việc</div>
                <div className="grid" style={{gap:8}}>
                  <input placeholder="Container No" value={assignForm.container_no} onChange={e=>setAssignForm({...assignForm, container_no:e.target.value})} />
                  <div style={{display:'flex', gap:8}}>
                    <input placeholder="from_slot_id (tùy chọn)" value={assignForm.from_slot_id} onChange={e=>setAssignForm({...assignForm, from_slot_id:e.target.value})} />
                    <input placeholder="to_slot_id (tùy chọn)" value={assignForm.to_slot_id} onChange={e=>setAssignForm({...assignForm, to_slot_id:e.target.value})} />
                    <button className="btn" onClick={createTask}>Tạo task</button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}


