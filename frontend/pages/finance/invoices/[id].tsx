import Header from '@components/Header';
import Card from '@components/Card';
import { useRouter } from 'next/router';
import useSWR, { mutate } from 'swr';
import { financeApi } from '@services/finance';
import { useState } from 'react';

export default function InvoiceDetail(){
  const router = useRouter(); const { id } = router.query as { id: string };
  const key = id ? `invoice_${id}` : null;
  const { data: inv } = useSWR(key, async ()=> financeApi.getInvoice(id));
  const [msg, setMsg] = useState('');
  const [issue, setIssue] = useState({ issue_date: '', due_date: '' });
  const [patch, setPatch] = useState({ due_date: '', notes: '' });
  if (!inv) return (<><Header /><main className="container"><Card title="Invoice">Đang tải…</Card></main></>);
  const canIssue = inv.status === 'DRAFT';
  const canCancel = inv.status === 'UNPAID' && Number(inv.paid_total||0) === 0;
  const doIssue = async ()=>{ setMsg(''); try{ await financeApi.issueInvoice(id, issue); mutate(key!); setMsg('Đã issue'); }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi issue'); } };
  const doPatch = async ()=>{ setMsg(''); try{ await financeApi.patchInvoice(id, patch); mutate(key!); setMsg('Đã cập nhật'); }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi cập nhật'); } };
  const doCancel = async ()=>{ setMsg(''); try{ await financeApi.cancelInvoice(id); mutate(key!); setMsg('Đã hủy'); }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi hủy'); } };
  return (
    <>
      <Header />
      <main className="container">
        <div className="grid" style={{gap:16}}>
          <Card title={`Invoice ${inv.invoice_no || '(DRAFT)'}`}>
            <div>Khách hàng: {inv.customer_id}</div>
            <div>Trạng thái: {inv.status}</div>
            <div>Tổng: {Number(inv.total_amount||0).toLocaleString('vi-VN')} | Đã thu: {Number(inv.paid_total||0).toLocaleString('vi-VN')}</div>
            <div style={{marginTop:8}}>Items:</div>
            <table className="table">
              <thead><tr><th>Service</th><th>Mô tả</th><th>Qty</th><th>Đơn giá</th><th>Tiền</th><th>Thuế</th><th>Tổng dòng</th></tr></thead>
              <tbody>
                {(inv.items||[]).map((it:any)=>(<tr key={it.id}><td>{it.service_code}</td><td>{it.description}</td><td>{it.qty}</td><td>{it.unit_price}</td><td>{it.line_amount}</td><td>{it.tax_amount}</td><td>{it.total_line_amount}</td></tr>))}
              </tbody>
            </table>
            {canIssue && (
              <div className="grid" style={{gap:8, marginTop:8}}>
                <div style={{fontWeight:600}}>Issue</div>
                <input type="date" value={issue.issue_date} onChange={e=>setIssue({...issue, issue_date:e.target.value})} title="Ngày phát hành" />
                <input type="date" value={issue.due_date} onChange={e=>setIssue({...issue, due_date:e.target.value})} title="Hạn thanh toán" />
                <button className="btn" onClick={doIssue}>Issue hóa đơn</button>
              </div>
            )}
            <div className="grid" style={{gap:8, marginTop:8}}>
              <div style={{fontWeight:600}}>Cập nhật</div>
              <input type="date" value={patch.due_date} onChange={e=>setPatch({...patch, due_date:e.target.value})} title="Hạn thanh toán" />
              <input placeholder="notes" value={patch.notes} onChange={e=>setPatch({...patch, notes:e.target.value})} />
              <button className="btn" onClick={doPatch}>Lưu</button>
            </div>
            {canCancel && <button className="btn" style={{marginTop:8}} onClick={doCancel}>Hủy hóa đơn</button>}
            {msg && <div style={{fontSize:12, color:'#1e3a8a', marginTop:8}}>{msg}</div>}
          </Card>
        </div>
      </main>
    </>
  );
}



