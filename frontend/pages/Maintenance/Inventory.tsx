import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useEffect, useState } from 'react';

export default function InventoryPage(){
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const key = ['inventory', search, onlyLow ? 'low' : 'all'].join(':');
  const { data: items } = useSWR(key, async ()=> maintenanceApi.listInventory({ q: search || undefined, low: onlyLow }));
  const [msg, setMsg] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { qty: number; rp: number }>>({});

  useEffect(()=>{
    const map: Record<string, { qty: number; rp: number }> = {};
    (items||[]).forEach((it:any)=>{ map[it.id] = { qty: it.qty_on_hand, rp: it.reorder_point }; });
    setDrafts(map);
  }, [items]);

  const save = async (id: string) => {
    setMsg('');
    const d = drafts[id] ?? (()=>{
      const it = (items||[]).find((x:any)=>x.id===id);
      return { qty: it?.qty_on_hand ?? 0, rp: it?.reorder_point ?? 0 };
    })();
    const payload = { qty_on_hand: Number(d.qty), reorder_point: Number(d.rp) };
    try{
      await maintenanceApi.updateInventory(id, payload);
      await mutate(key);
      setMsg('Đã cập nhật');
    }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi cập nhật'); }
  };

  return (
    <>
      <Header />
      <main className="container">
        <Card title="Tồn kho vật tư">
          <div style={{display:'flex', gap:8, marginBottom:8}}>
            <input placeholder="Tìm kiếm tên vật tư" value={search} onChange={e=>setSearch(e.target.value)} />
            <label style={{display:'flex', alignItems:'center', gap:6}}>
              <input type="checkbox" checked={onlyLow} onChange={e=>setOnlyLow(e.target.checked)} /> Chỉ hiển thị low stock
            </label>
          </div>
          <table className="table">
            <thead><tr><th>Tên</th><th>ĐVT</th><th>Tồn</th><th>Điểm đặt hàng</th><th>Hành động</th></tr></thead>
            <tbody>
              {(items||[]).map((it:any)=>{
                const d = drafts[it.id] || { qty: it.qty_on_hand, rp: it.reorder_point };
                const isLow = (d.qty <= d.rp);
                return (
                  <tr key={it.id} style={{background: isLow ? '#fff7ed' : undefined}}>
                    <td>{it.name}</td>
                    <td>{it.uom}</td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{width:90}}
                        value={String(d.qty)}
                        onChange={e=>setDrafts(prev=>{
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          return { ...prev, [it.id]: { ...cur, qty: next } };
                        })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{width:90}}
                        value={String(d.rp)}
                        onChange={e=>setDrafts(prev=>{
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          return { ...prev, [it.id]: { ...cur, rp: next } };
                        })}
                      />
                    </td>
                    <td><button className="btn" onClick={()=>save(it.id)}>Lưu</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {msg && <div style={{fontSize:12, color:'#1e3a8a', marginTop:8}}>{msg}</div>}
        </Card>
      </main>
    </>
  );
}


