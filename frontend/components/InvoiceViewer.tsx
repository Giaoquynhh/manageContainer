import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface InvoiceViewerProps {
  requestId: string;
  visible: boolean;
  onClose: () => void;
}

interface Invoice {
  id: string;
  invoice_no: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  paid_total: number;
  items: InvoiceItem[];
  serviceRequest?: {
    id: string;
    container_no: string;
    type: string;
    status: string;
  };
}

interface InvoiceItem {
  id: string;
  service_code: string;
  description: string;
  qty: number;
  unit_price: number;
  line_amount: number;
  tax_amount: number;
  total_line_amount: number;
}

export default function InvoiceViewer({ requestId, visible, onClose }: InvoiceViewerProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && requestId) {
      fetchInvoice();
    }
  }, [visible, requestId]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      
      // Sử dụng endpoint cũ nhưng đã được sửa để cho phép customer truy cập
      const response = await api.get(`/finance/invoices/details?source_id=${requestId}`);
      
      
      if (response.data && response.data.length > 0) {
        setInvoice(response.data[0]);
      } else {
        setError('Không tìm thấy hóa đơn cho request này');
      }
    } catch (err: any) {
      console.error('🔍 Error fetching invoice:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!invoice) return;
    
    if (window.confirm('Bạn có chắc chắn muốn thanh toán hóa đơn này?')) {
      try {
        // Cập nhật trạng thái thanh toán
        const response = await api.patch(`/requests/${requestId}/payment-status`, {
          is_paid: true
        });
        
        if (response.status === 200) {
          alert('✅ Thanh toán thành công!');
          onClose();
          // Refresh trang cha
          window.location.reload();
        }
      } catch (err: any) {
        alert('❌ Lỗi khi thanh toán: ' + (err.response?.data?.message || 'Lỗi không xác định'));
      }
    }
  };

  const handleViewEIR = async () => {
    if (!invoice?.serviceRequest?.container_no) return;
    
    try {
      // Gọi API trực tiếp để lấy file EIR
      const eirUrl = `/finance/eir/container/${encodeURIComponent(invoice.serviceRequest.container_no)}`;
      
      // Tạo một iframe ẩn để mở file EIR
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = eirUrl;
      document.body.appendChild(iframe);
      
      // Mở trong tab mới với target _blank
      window.open(eirUrl, '_blank', 'noopener,noreferrer');
      
      // Xóa iframe sau khi mở
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
      
    } catch (err: any) {
      alert('❌ Lỗi khi mở EIR: ' + (err.message || 'Lỗi không xác định'));
    }
  };

  if (!visible) return null;

  // Inline styles để tránh lỗi CSS import
  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    content: {
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '1000px',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      position: 'relative' as const,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: '1px solid #eee',
      paddingBottom: '10px',
    },
    headerTitle: {
      margin: 0,
      fontSize: '24px',
      color: '#333',
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#666',
    },
    details: {
      marginBottom: '20px',
    },
    invoiceHeader: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px',
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '8px',
    },
    invoiceInfo: {
      margin: 0,
      color: '#2c3e50',
      fontSize: '20px',
    },
    invoiceInfoP: {
      margin: '5px 0',
      fontSize: '14px',
    },
    invoiceAmounts: {
      margin: '5px 0',
      fontSize: '14px',
      textAlign: 'right' as const,
    },
    itemsTitle: {
      margin: '20px 0 15px 0',
      color: '#2c3e50',
      fontSize: '18px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginBottom: '20px',
      fontSize: '14px',
    },
    tableHeader: {
      border: '1px solid #dee2e6',
      padding: '10px',
      textAlign: 'left' as const,
      backgroundColor: '#f8f9fa',
      fontWeight: 600,
      color: '#495057',
    },
    tableCell: {
      border: '1px solid #dee2e6',
      padding: '10px',
      textAlign: 'left' as const,
      backgroundColor: 'white',
    },
    actions: {
      textAlign: 'center' as const,
      marginTop: '20px',
    },
    actionBtn: {
      padding: '10px 20px',
      fontSize: '16px',
      borderRadius: '6px',
      cursor: 'pointer',
      border: 'none',
      background: '#007bff',
      color: 'white',
      marginRight: '10px',
    },
    eirBtn: {
      padding: '10px 20px',
      fontSize: '16px',
      borderRadius: '6px',
      cursor: 'pointer',
      border: 'none',
      background: '#17a2b8',
      color: 'white',
      marginRight: '10px',
    },
    statusBadge: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 500,
      color: 'white',
      marginLeft: '8px',
    },
    loading: {
      textAlign: 'center' as const,
      padding: '50px',
      fontSize: '18px',
      color: '#777',
    },
    error: {
      textAlign: 'center' as const,
      padding: '50px',
      fontSize: '18px',
      color: '#dc3545',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Hóa đơn chi tiết</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div>
          {loading && (
            <div style={styles.loading}>
              <p>Đang tải hóa đơn...</p>
            </div>
          )}
          
          {error && (
            <div style={styles.error}>
              <p>❌ {error}</p>
            </div>
          )}
          
          {invoice && (
            <div style={styles.details}>
              <div style={styles.invoiceHeader}>
                <div>
                  <h3 style={styles.invoiceInfo}>Hóa đơn #{invoice.invoice_no}</h3>
                  <p style={styles.invoiceInfoP}><strong>Ngày phát hành:</strong> {new Date(invoice.issue_date).toLocaleDateString('vi-VN')}</p>
                  <p style={styles.invoiceInfoP}><strong>Hạn thanh toán:</strong> {new Date(invoice.due_date).toLocaleDateString('vi-VN')}</p>
                  <p style={styles.invoiceInfoP}><strong>Trạng thái:</strong> 
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: invoice.status === 'PAID' ? '#28a745' : 
                                   invoice.status === 'PARTIAL' ? '#ffc107' : '#dc3545',
                      color: invoice.status === 'PARTIAL' ? '#212529' : 'white'
                    }}>
                      {invoice.status === 'PAID' ? 'Đã thanh toán' : 
                       invoice.status === 'PARTIAL' ? 'Thanh toán một phần' : 'Chưa thanh toán'}
                    </span>
                  </p>
                  {invoice.serviceRequest && (
                    <p style={styles.invoiceInfoP}><strong>Container:</strong> {invoice.serviceRequest.container_no}</p>
                  )}
                </div>
                
                <div>
                  <p style={styles.invoiceAmounts}><strong>Tổng tiền hàng:</strong> {invoice.subtotal.toLocaleString('vi-VN')} VND</p>
                  <p style={styles.invoiceAmounts}><strong>Thuế:</strong> {invoice.tax_amount.toLocaleString('vi-VN')} VND</p>
                  <p style={styles.invoiceAmounts}><strong>Tổng cộng:</strong> {invoice.total_amount.toLocaleString('vi-VN')} VND</p>
                  <p style={styles.invoiceAmounts}><strong>Đã thanh toán:</strong> {invoice.paid_total.toLocaleString('vi-VN')} VND</p>
                </div>
              </div>
              
              <div>
                <h4 style={styles.itemsTitle}>Chi tiết dịch vụ</h4>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Mã dịch vụ</th>
                      <th style={styles.tableHeader}>Mô tả</th>
                      <th style={styles.tableHeader}>Số lượng</th>
                      <th style={styles.tableHeader}>Đơn giá</th>
                      <th style={styles.tableHeader}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.tableCell}>{item.service_code}</td>
                        <td style={styles.tableCell}>{item.description}</td>
                        <td style={styles.tableCell}>{item.qty}</td>
                        <td style={styles.tableCell}>{item.unit_price.toLocaleString('vi-VN')} VND</td>
                        <td style={styles.tableCell}>{item.total_line_amount.toLocaleString('vi-VN')} VND</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={styles.actions}>
                {invoice.serviceRequest?.container_no && (
                  <button 
                    style={styles.eirBtn}
                    onClick={handleViewEIR}
                  >
                    📄 Xem EIR Container {invoice.serviceRequest.container_no}
                  </button>
                )}
                
                {invoice.status !== 'PAID' && (
                  <button 
                    style={styles.actionBtn}
                    onClick={handlePayment}
                  >
                    💰 Thanh toán hóa đơn
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
