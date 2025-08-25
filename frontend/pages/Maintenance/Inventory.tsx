import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { maintenanceApi } from '@services/maintenance';
import { useEffect, useState } from 'react';

export default function InventoryPage(){
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const key = ['inventory', search, onlyLow ? 'low' : 'all'].join(':');
  const { data: items } = useSWR(key, async ()=> maintenanceApi.listInventory({ q: search || undefined, low: onlyLow }));
  const [msg, setMsg] = useState('');
  const [drafts, setDrafts] = useState<Record<string, { qty: number; rp: number; price: number }>>({});
  const [newItem, setNewItem] = useState({ name: '', uom: '', qty: 0, rp: 0, price: 0 });

  useEffect(()=>{
    const map: Record<string, { qty: number; rp: number; price: number }> = {};
    (items||[]).forEach((it:any)=>{ map[it.id] = { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 }; });
    setDrafts(map);
  }, [items]);

  const save = async (id: string) => {
    setMsg('');
    const d = drafts[id] ?? (()=>{
      const it = (items||[]).find((x:any)=>x.id===id);
      return { qty: it?.qty_on_hand ?? 0, rp: it?.reorder_point ?? 0, price: it?.unit_price ?? 0 };
    })();
    const payload = { qty_on_hand: Number(d.qty), reorder_point: Number(d.rp), unit_price: Number(d.price) };
    try{
      await maintenanceApi.updateInventory(id, payload);
      await mutate(key);
      setMsg('Đã cập nhật');
    }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi cập nhật'); }
  };

  const addNewItem = async () => {
    if (!newItem.name || !newItem.uom) {
      setMsg('Vui lòng nhập tên và đơn vị tính');
      return;
    }
    
    setMsg('');
    try {
      const payload = {
        name: newItem.name,
        uom: newItem.uom,
        qty_on_hand: Number(newItem.qty),
        reorder_point: Number(newItem.rp),
        unit_price: Number(newItem.price)
      };
      
      await maintenanceApi.createInventory(payload);
      await mutate(key);
      setNewItem({ name: '', uom: '', qty: 0, rp: 0, price: 0 });
      setShowAddForm(false);
      setMsg('Đã thêm sản phẩm mới');
    } catch(e:any) {
      setMsg(e?.response?.data?.message || 'Lỗi thêm sản phẩm');
    }
  };

  return (
    <>
      <Header />
      <main className="container">
        <Card title="Tồn kho vật tư">
          <div style={{display:'flex', gap:8, marginBottom:8, justifyContent:'space-between', alignItems:'center'}}>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <input placeholder="Tìm kiếm tên vật tư" value={search} onChange={e=>setSearch(e.target.value)} />
              <label style={{display:'flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={onlyLow} onChange={e=>setOnlyLow(e.target.checked)} /> Chỉ hiển thị low stock
              </label>
            </div>
            <button 
              className="btn" 
              onClick={() => setShowAddForm(!showAddForm)}
              style={{backgroundColor: showAddForm ? '#dc2626' : '#1e40af'}}
            >
              {showAddForm ? 'Hủy' : 'Thêm sản phẩm'}
            </button>
                      </div>
            
            {showAddForm && (
              <div style={{
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '16px',
                backgroundColor: '#f9fafb'
              }}>
                <h4 style={{margin: '0 0 16px 0', color: '#1f2937'}}>Thêm sản phẩm mới</h4>
                <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end'}}>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>Tên sản phẩm *</label>
                    <input
                      type="text"
                      placeholder="Nhập tên sản phẩm"
                      value={newItem.name}
                      onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>ĐVT *</label>
                    <input
                      type="text"
                      placeholder="pcs, lit, kg..."
                      value={newItem.uom}
                      onChange={e => setNewItem(prev => ({ ...prev, uom: e.target.value }))}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>Tồn kho</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={String(newItem.qty)}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                        setNewItem(prev => ({ ...prev, qty: next }));
                      }}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>Điểm đặt hàng</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={String(newItem.rp)}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                        setNewItem(prev => ({ ...prev, rp: next }));
                      }}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', fontSize: '12px', marginBottom: '4px', color: '#6b7280'}}>Đơn giá (VND)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={String(newItem.price)}
                      onChange={e => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                        setNewItem(prev => ({ ...prev, price: next }));
                      }}
                      style={{width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                    />
                  </div>
                  <button 
                    className="btn" 
                    onClick={addNewItem}
                    style={{backgroundColor: '#059669', padding: '8px 16px'}}
                  >
                    Thêm
                  </button>
                </div>
              </div>
            )}
            
            <table className="table">
            <thead><tr><th>Tên</th><th>ĐVT</th><th>Tồn</th><th>Điểm đặt hàng</th><th>Đơn giá (VND)</th><th>Hành động</th></tr></thead>
            <tbody>
              {(items||[]).map((it:any)=>{
                const d = drafts[it.id] || { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
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
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          return { ...prev, [it.id]: { ...cur, rp: next } };
                        })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        style={{width:120}}
                        value={String(d.price)}
                        onChange={e=>setDrafts(prev=>{
                          const cur = prev[it.id] ?? { qty: it.qty_on_hand, rp: it.reorder_point, price: it.unit_price || 0 };
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          const next = cleaned === '' ? 0 : parseInt(cleaned, 10);
                          return { ...prev, [it.id]: { ...cur, price: next } };
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


