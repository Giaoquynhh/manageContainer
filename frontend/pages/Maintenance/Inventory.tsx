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
  const [drafts, setDrafts] = useState<Record<string, { qty: number; rp: number; price: number }>>({});

  // Lưu drafts vào localStorage
  const saveDraftsToStorage = (newDrafts: Record<string, { qty: number; rp: number; price: number }>) => {
    try {
      localStorage.setItem('inventory_drafts', JSON.stringify(newDrafts));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };

  // Load drafts từ localStorage
  const loadDraftsFromStorage = () => {
    try {
      const saved = localStorage.getItem('inventory_drafts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
    return {};
  };

  useEffect(()=>{
    const map: Record<string, { qty: number; rp: number; price: number }> = {};
    (items||[]).forEach((it:any)=>{ 
      map[it.id] = { 
        qty: it.qty_on_hand, 
        rp: it.reorder_point, 
        price: it.unit_price || 0  // Sử dụng unit_price từ database
      }; 
    });
    
    // Không load drafts từ localStorage nữa, chỉ sử dụng dữ liệu từ database
    console.log('useEffect - Items:', items, 'Map:', map);
    setDrafts(map);
  }, [items]);

  const updateInventory = async (id: string) => {
    const d = drafts[id];
    if (!d) return;
    
    try {
      await maintenanceApi.updateInventory(id, {
        qty_on_hand: d.qty,
        reorder_point: d.rp,
        unit_price: d.price  // Thêm unit_price vào payload
      });
      setMsg('Cập nhật thành công');
      mutate(); // Refresh data
    } catch (error) {
      setMsg('Lỗi cập nhật: ' + error);
    }
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
            <thead>
              <tr>
                <th>Tên</th>
                <th>ĐVT</th>
                <th>Tồn</th>
                <th>Safety Stock</th>
                <th>Đơn giá</th>

                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {(items||[]).map((it:any)=>{
                const d = drafts[it.id] || { 
                  qty: it.qty_on_hand, 
                  rp: it.reorder_point, 
                  price: it.unit_price || 0
                };
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
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          console.log('Qty input changed:', e.target.value, 'Cleaned:', cleaned, 'Parsed:', next);
                          const newDrafts = { ...prev, [it.id]: { ...cur, qty: next } };
                          return newDrafts;
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
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          const newDrafts = { ...prev, [it.id]: { ...cur, rp: next } };
                          return newDrafts;
                        })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{width:90}}
                        value={String(d.price)}
                        onChange={e=>setDrafts(prev=>{
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          const newDrafts = { ...prev, [it.id]: { ...cur, price: next } };
                          return newDrafts;
                        })}
                      />
                    </td>
                    <td>
                      <button onClick={()=>updateInventory(it.id)} style={{
                        background: '#1e40af',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>
                        Cập nhật
                      </button>
                    </td>
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


