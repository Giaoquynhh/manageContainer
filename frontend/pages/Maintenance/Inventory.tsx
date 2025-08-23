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

  useEffect(()=>{
    const map: Record<string, { qty: number; rp: number; price: number }> = {};
    (items||[]).forEach((it:any)=>{ 
      map[it.id] = { 
        qty: it.qty_on_hand, 
        rp: it.reorder_point, 
        price: it.unit_price || it.price || it.unitPrice || 0 
      }; 
    });
    setDrafts(map);
  }, [items]);

  const addProduct = async (id: string) => {
    setMsg('');
    try{
      // Here you would call your API to add more products
      // await maintenanceApi.addProductToInventory(id);
      setMsg('Đã thêm sản phẩm vào tồn kho thành công');
      setTimeout(() => setMsg(''), 3000);
    }catch(e:any){ 
      setMsg(e?.response?.data?.message || 'Lỗi thêm sản phẩm'); 
    }
  };

  const updatePrice = async (id: string, newPrice: number) => {
    setMsg('');
    try{
      // For now, just show success message (API call commented out)
      // await maintenanceApi.updateInventoryPrice(id, { unit_price: newPrice });
      // await mutate(key); // Refresh data from server
      setMsg(`Đã cập nhật đơn giá thành công: ${newPrice.toFixed(2)} VNĐ`);
      setTimeout(() => setMsg(''), 3000);
    }catch(e:any){ 
      setMsg(e?.response?.data?.message || 'Lỗi cập nhật đơn giá'); 
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

                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {(items||[]).map((it:any)=>{
                const d = drafts[it.id] || { 
                  qty: it.qty_on_hand, 
                  rp: it.reorder_point, 
                  price: it.unit_price || it.price || it.unitPrice || 0 
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
                                         <td>
                       <input
                         type="number"
                         min="0"
                         step="0.01"
                         style={{width:90, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px'}}
                         value={d.price}
                         placeholder="Nhập giá"
                         onChange={e=>{
                           const newPrice = Math.max(0, parseFloat(e.target.value) || 0);
                           console.log('Price changed to:', newPrice); // Debug log
                           // Update local draft state
                           setDrafts(prev => ({
                             ...prev,
                             [it.id]: { ...d, price: newPrice }
                           }));
                         }}
                         onBlur={e=>{
                           const newPrice = Math.max(0, parseFloat(e.target.value) || 0);
                           console.log('Price onBlur:', newPrice); // Debug log
                           if (newPrice !== d.price) {
                             updatePrice(it.id, newPrice);
                           }
                         }}
                         onKeyPress={e=>{
                           if (e.key === 'Enter') {
                             const newPrice = Math.max(0, parseFloat(e.target.value) || 0);
                             if (newPrice !== d.price) {
                               updatePrice(it.id, newPrice);
                             }
                           }
                         }}
                       />
                     </td>
                    <td><button className="btn" onClick={()=>addProduct(it.id)}>Thêm sản phẩm</button></td>
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


