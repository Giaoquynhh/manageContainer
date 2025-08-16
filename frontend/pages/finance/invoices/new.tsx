import Header from '@components/Header';
import Card from '@components/Card';
import { useEffect, useState } from 'react';
import { financeApi, InvoiceItemInput } from '@services/finance';
import Router from 'next/router';

export default function NewInvoice(){
  const [form, setForm] = useState<any>({ customer_id: '', currency: 'VND', issue_date: '', due_date: '', notes: '' });
  const [items, setItems] = useState<InvoiceItemInput[]>([{ service_code: '', description:'', qty: 0, unit_price: 0 }]);
  const [qtyTexts, setQtyTexts] = useState<string[]>(['']);
  const [priceTexts, setPriceTexts] = useState<string[]>(['']);
  const [services, setServices] = useState<Array<{ code: string; name: string; default_description?: string; default_unit_price?: number; tax_rate?: number }>>([]);
  const [msg, setMsg] = useState('');
  const addItem = ()=> { setItems(prev=>[...prev, { service_code:'', description:'', qty:0, unit_price:0 }]); setQtyTexts(prev=>[...prev, '']); setPriceTexts(prev=>[...prev, '']); };
  const onPickService = (idx: number, code: string)=>{
    const svc = services.find(s=>s.code === code);
    setItems(prev=>{
      const n = [...prev];
      const current = { ...n[idx] } as any;
      current.service_code = code;
      if (svc){
        // When selecting a service, always refresh dependent fields from catalog
        current.description = svc.default_description || svc.name;
        current.unit_price = (svc.default_unit_price ?? 0);
        current.tax_rate = (svc.tax_rate ?? undefined);
      } else {
        // Cleared or unmatched: reset description for clarity
        current.description = '';
      }
      n[idx] = current;
      return n;
    });
    if (svc){
      setPriceTexts(prev=>{ const np=[...prev]; np[idx] = String(svc.default_unit_price ?? 0); return np; });
    }
  };
  useEffect(()=>{ (async()=>{ try{ const data = await financeApi.listServices(); setServices(Array.isArray(data)? data: []); }catch{ setServices([]); } })(); },[]);
  const save = async ()=>{
    setMsg('');
    try{
      const payload: any = {
        customer_id: String(form.customer_id||'').trim(),
        currency: form.currency || 'VND',
        notes: form.notes || undefined,
        items: items.map(it=>({
          service_code: it.service_code,
          description: it.description,
          qty: Number(it.qty||0),
          unit_price: Number(it.unit_price||0),
          tax_code: (it as any).tax_code,
          tax_rate: (it as any).tax_rate
        }))
      };
      if (form.issue_date) payload.issue_date = form.issue_date; // omit when empty to satisfy Joi
      if (form.due_date) payload.due_date = form.due_date;
      const inv = await financeApi.createInvoice(payload);
      setMsg('Đã tạo');
      Router.push(`/finance/invoices/${inv.id}`);
    }
    catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi tạo hóa đơn'); }
  };
  return (
    <>
      <Header />
      <main className="container">
        <Card title="Tạo hóa đơn (DRAFT)">
          <div className="grid" style={{gap:8}}>
            <input placeholder="Customer ID" value={form.customer_id} onChange={e=>setForm({...form, customer_id:e.target.value})} title="Mã khách hàng nội bộ hoặc tham chiếu đối tác" />
            <div style={{fontSize:12, color:'#6b7280'}}>Customer ID: Mã khách hàng trong hệ thống (dùng để quy chiếu công nợ).</div>
            <div style={{fontWeight:600}}>Items</div>
            <div style={{fontSize:12, color:'#6b7280'}}>Service: chọn từ danh mục; Mô tả: nội dung hiển thị trên hóa đơn; Qty: số lượng (số nguyên không âm); Unit price: đơn giá trước thuế (VND). Bỏ trống ngày nếu chưa issue ngay.</div>
            {items.map((it,idx)=> (
              <div key={idx} style={{display:'grid', gridTemplateColumns:'120px 1fr 120px 140px', gap:8, alignItems:'center'}}>
                <>
                  <input list="svc-list" placeholder="Service" value={it.service_code} onChange={e=>onPickService(idx, e.target.value)} title="Chọn mã dịch vụ từ danh mục" />
                  <datalist id="svc-list">
                    {services.map(s=> (<option key={s.code} value={s.code}>{s.name}</option>))}
                  </datalist>
                </>
                <input placeholder="Mô tả" value={it.description} onChange={e=>setItems(prev=>{ const n=[...prev]; n[idx]={...n[idx], description:e.target.value}; return n; })} title="Mô tả chi tiết dịch vụ trên hóa đơn" />
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Qty" value={qtyTexts[idx] ?? (it.qty ? String(it.qty) : '')} onChange={e=>{ const digits = (e.target.value||'').replace(/\D/g,''); setQtyTexts(prev=>{ const nt=[...prev]; nt[idx]=digits; return nt; }); setItems(prev=>{ const n=[...prev]; const v = digits === '' ? 0 : parseInt(digits, 10); n[idx] = { ...n[idx], qty: v }; return n; }); }} title="Số lượng (số nguyên không âm)" />
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Unit price" value={priceTexts[idx] ?? (it.unit_price ? String(it.unit_price) : '')} onChange={e=>{ const digits = (e.target.value||'').replace(/\D/g,''); setPriceTexts(prev=>{ const nt=[...prev]; nt[idx]=digits; return nt; }); setItems(prev=>{ const n=[...prev]; const v = digits === '' ? 0 : parseInt(digits, 10); n[idx] = { ...n[idx], unit_price: v }; return n; }); }} title="Đơn giá trước thuế (VND)" />
              </div>
            ))}
            <div style={{display:'flex', gap:8}}>
              <button className="btn" onClick={addItem}>Thêm dòng</button>
              <button className="btn" onClick={save}>Lưu</button>
            </div>
            {msg && <div style={{fontSize:12, color:'#1e3a8a'}}>{msg}</div>}
          </div>
        </Card>
      </main>
    </>
  );
}



