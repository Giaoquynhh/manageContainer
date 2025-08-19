import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFSlipProps {
  containerInfo: any;
  selectedPosition: any;
}

export const PDFSlip: React.FC<PDFSlipProps> = ({ containerInfo, selectedPosition }) => {
  const slipRef = useRef<HTMLDivElement>(null);

  // Chuẩn hóa dữ liệu vị trí để compatible với 2 dạng:
  // 1) Dạng cũ: { block: 'B1', slot: '11', yard: '...' }
  // 2) Dạng mới từ API suggest: { slot: { id, code, block_code?, block? }, score }
  const normalized = (() => {
    const slotObj: any = selectedPosition?.slot || selectedPosition || {};
    const positionCode: string = slotObj.code || (
      selectedPosition?.block && selectedPosition?.slot
        ? `${selectedPosition.block}-${selectedPosition.slot}`
        : 'UNKNOWN'
    );
    const blockLabel: string = slotObj.block?.code || slotObj.block_code || 'Bãi';
    return { slotObj, positionCode, blockLabel };
  })();

  const generatePDF = async () => {
    if (!slipRef.current) return;

    try {
      // Tạo canvas từ HTML
      const canvas = await html2canvas(slipRef.current, {
        scale: 2, // Độ phân giải cao hơn
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Tạo PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Tính toán kích thước để fit vào A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Thêm trang đầu
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Thêm trang mới nếu cần
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Tải xuống PDF
      const fileName = `Container_${containerInfo.container_no}_${normalized.positionCode}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Lỗi khi tạo PDF:', error);
      alert('Có lỗi khi tạo PDF. Vui lòng thử lại.');
    }
  };

  const printSlip = () => {
    if (!slipRef.current) return;
    
    // Tạo cửa sổ in mới
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Phiếu đặt container</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.6;
              }
              .print-slip { max-width: 800px; margin: 0 auto; }
              .slip-header { 
                text-align: center; 
                border-bottom: 3px solid #000; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
              }
              .slip-header h1 { 
                color: #000; 
                font-size: 28px; 
                font-weight: bold; 
                margin: 0 0 15px 0; 
                text-transform: uppercase; 
              }
              .slip-info { 
                display: flex; 
                justify-content: space-between; 
                color: #666; 
                font-size: 14px; 
              }
              .info-section, .position-section, .instructions-section { 
                margin-bottom: 30px; 
              }
              .info-section h2, .position-section h2, .instructions-section h2 { 
                color: #000; 
                font-size: 18px; 
                font-weight: bold; 
                margin: 0 0 15px 0; 
                padding-bottom: 10px; 
                border-bottom: 2px solid #ccc; 
              }
              .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px; 
              }
              .info-row { 
                display: flex; 
                justify-content: space-between; 
                padding: 10px 0; 
                border-bottom: 1px solid #eee; 
              }
              .info-row .label { 
                font-weight: 600; 
                color: #666; 
              }
              .info-row .value { 
                font-weight: 500; 
                color: #000; 
              }
              .position-highlight { 
                text-align: center; 
                padding: 20px; 
                background: #f0f8ff; 
                border: 2px solid #000; 
                border-radius: 8px; 
              }
              .position-code-large { 
                font-size: 48px; 
                font-weight: bold; 
                color: #000; 
                font-family: monospace; 
                margin-bottom: 15px; 
              }
              .position-details { 
                display: flex; 
                flex-direction: column; 
                gap: 10px; 
              }
              .yard-name { 
                font-size: 18px; 
                font-weight: 600; 
                color: #000; 
              }
              .status { 
                font-size: 16px; 
                color: #006400; 
                font-weight: 500; 
              }
              .instructions-section ul { 
                list-style: none; 
                padding: 0; 
                margin: 0; 
              }
              .instructions-section li { 
                padding: 10px 0; 
                border-bottom: 1px solid #eee; 
                position: relative; 
                padding-left: 20px; 
              }
              .instructions-section li::before { 
                content: '✓'; 
                position: absolute; 
                left: 0; 
                color: #006400; 
                font-weight: bold; 
              }
              .instructions-section li:last-child { 
                border-bottom: none; 
              }
              .slip-footer { 
                border-top: 2px solid #ccc; 
                padding-top: 20px; 
              }
              .signature-section { 
                display: flex; 
                justify-content: space-between; 
                margin-top: 30px; 
              }
              .signature-line { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                gap: 10px; 
              }
              .signature-line span:first-child { 
                font-weight: 600; 
                color: #000; 
                font-size: 14px; 
              }
              .signature-line span:last-child { 
                width: 150px; 
                height: 2px; 
                background: #000; 
                border-radius: 4px; 
              }
              @media print {
                body { margin: 0; }
                .print-slip { max-width: none; }
              }
            </style>
          </head>
          <body>
            ${slipRef.current.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  if (!containerInfo || !selectedPosition) return null;

  return (
    <div className="pdf-slip-container">
      <div className="pdf-actions">
        <button className="btn btn-primary" onClick={generatePDF}>
          📄 Tải xuống PDF
        </button>
        <button className="btn btn-secondary" onClick={printSlip}>
          🖨️ In phiếu
        </button>
      </div>

      <div ref={slipRef} className="print-slip">
        <div className="slip-header">
          <h1>PHIẾU ĐẶT CONTAINER</h1>
          <div className="slip-info">
            <span>Ngày: {new Date().toLocaleDateString('vi-VN')}</span>
            <span>Giờ: {new Date().toLocaleTimeString('vi-VN')}</span>
          </div>
        </div>

        <div className="slip-content">
          <div className="info-section">
            <h2>THÔNG TIN CONTAINER</h2>
            <div className="info-grid">
              <div className="info-row">
                <span className="label">Container No:</span>
                <span className="value">{containerInfo.container_no}</span>
              </div>
              <div className="info-row">
                <span className="label">Loại:</span>
                <span className="value">{containerInfo.type || 'Chưa xác định'}</span>
              </div>
              <div className="info-row">
                <span className="label">Trạng thái cổng:</span>
                <span className="value">GATE IN</span>
              </div>
              <div className="info-row">
                <span className="label">Cổng xe đã vào:</span>
                <span className="value">Cổng 1</span>
              </div>
            </div>
          </div>

          <div className="position-section">
            <h2>VỊ TRÍ ĐÃ CHỌN</h2>
            <div className="position-highlight">
              <div className="position-code-large">{normalized.positionCode}</div>
              <div className="position-details">
                <span className="yard-name">{normalized.blockLabel}</span>
                <span className="status">Trạng thái: Trống</span>
              </div>
            </div>
          </div>

          <div className="instructions-section">
            <h2>HƯỚNG DẪN</h2>
            <ul>
              <li>Đưa container đến vị trí: <strong>{normalized.positionCode}</strong></li>
              <li>Đặt container theo hướng dẫn của nhân viên bãi</li>
              <li>Xác nhận vị trí đã đặt với nhân viên quản lý</li>
              <li>Giữ phiếu này để đối chiếu</li>
            </ul>
          </div>
        </div>

        <div className="slip-footer">
          <div className="signature-section">
            <div className="signature-line">
              <span>Người đặt container</span>
              <span>Chữ ký</span>
            </div>
            <div className="signature-line">
              <span>Nhân viên bãi</span>
              <span>Chữ ký</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
