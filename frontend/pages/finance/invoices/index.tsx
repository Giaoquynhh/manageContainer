import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { financeApi } from '@services/finance';
import { useState } from 'react';

export default function InvoiceList(){
  const [status, setStatus] = useState<string>('');
  const key = ['finance_invoices', status].join(':');
  const { data: invoices } = useSWR(key, async ()=> financeApi.listInvoices({ status: status || undefined }));
  return (
    <>
      <Header />
      <main className="container">
        <div className="grid" style={{gap:16}}>
          <Card title="Hóa đơn">
            <div style={{display:'flex', gap:8, marginBottom:8}}>
              <select value={status} onChange={e=>{ setStatus(e.target.value); mutate(key); }}>
                <option value="">Tất cả</option>
                <option value="DRAFT">DRAFT</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <Link className="btn" href="/finance/invoices/new">Tạo hóa đơn</Link>
            </div>
            <table className="table">
              <thead><tr><th>Invoice No</th><th>Khách hàng</th><th>Ngày</th><th>Hạn</th><th>Tổng</th><th>Đã thu</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {(invoices||[]).map((it:any)=> (
                  <tr key={it.id}>
                    <td>{it.invoice_no || '(DRAFT)'}</td>
                    <td>{it.customer_id}</td>
                    <td>{it.issue_date ? new Date(it.issue_date).toLocaleDateString() : '-'}</td>
                    <td>{it.due_date ? new Date(it.due_date).toLocaleDateString() : '-'}</td>
                    <td>{Number(it.total_amount||0).toLocaleString('vi-VN')}</td>
                    <td>{Number(it.paid_total||0).toLocaleString('vi-VN')}</td>
                    <td>{it.status}</td>
                    <td style={{display:'flex', gap:6}}>
                      <Link className="btn" href={`/finance/invoices/${it.id}`}>Xem</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </main>
    </>
  );
}



