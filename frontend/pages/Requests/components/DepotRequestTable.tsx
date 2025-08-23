import React, { useState } from 'react';
import DepotChatMini from './DepotChatMini';

interface DepotRequestTableProps {
	data?: any[];
	loading?: boolean;
	onDocumentClick?: (doc: any) => void;
	onToggleSupplement?: (requestId: string) => void;
	onForward?: (requestId: string) => void;
	onReject?: (requestId: string) => void;
	onChangeStatus?: (id: string, status: string) => void;
	onSendPayment?: (id: string) => void;
	onSoftDelete?: (id: string, scope: string) => void;
	loadingId?: string;
}

export default function DepotRequestTable({ 
	data, 
	loading, 
	onDocumentClick,
	onToggleSupplement,
	onForward,
	onReject,
	onChangeStatus,
	onSendPayment,
	onSoftDelete,
	loadingId 
}: DepotRequestTableProps) {
	const headerCellStyle: React.CSSProperties = { position: 'sticky', top: 0, background: '#fff', zIndex: 2 };
	const firstHeaderCellStyle: React.CSSProperties = { ...headerCellStyle, left: 0, zIndex: 3, boxShadow: '2px 0 0 rgba(0,0,0,0.05)' };
	const firstColCellStyle: React.CSSProperties = { position: 'sticky', left: 0, background: '#fff', zIndex: 1, boxShadow: '2px 0 0 rgba(0,0,0,0.03)' };
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [openDocsId, setOpenDocsId] = useState<string | null>(null);
	const getStatusBadge = (status: string) => {
		const statusConfig: Record<string, { label: string; className: string }> = {
			PENDING: { label: 'Chờ xử lý', className: 'status-pending' },
			RECEIVED: { label: 'Đã nhận', className: 'status-received' },
			COMPLETED: { label: 'Hoàn thành', className: 'status-completed' },
			EXPORTED: { label: 'Đã xuất', className: 'status-exported' },
			REJECTED: { label: 'Từ chối', className: 'status-rejected' },
			IN_YARD: { label: 'Trong kho', className: 'status-in-yard' },
			LEFT_YARD: { label: 'Đã rời kho', className: 'status-left-yard' }
		};

		const config = statusConfig[status] || { label: status, className: 'status-default' };
		return (
			<span className={`status-badge ${config.className}`}>
				{config.label}
			</span>
		);
	};

	const getTypeLabel = (type: string) => {
		const typeLabels: Record<string, string> = {
			IMPORT: 'Nhập',
			EXPORT: 'Xuất',
			CONVERT: 'Chuyển đổi'
		};
		return typeLabels[type as keyof typeof typeLabels] || type;
	};

	if (loading) {
		return (
			<div className="table-loading">
				<div className="loading-spinner"></div>
				<p>Đang tải dữ liệu...</p>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div className="table-empty">
				<div className="empty-icon">📋</div>
				<p>Chưa có yêu cầu nào</p>
				<small>Không có yêu cầu nào để xử lý</small>
			</div>
		);
	}

	return (
		<div className="table-container" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)', border: '1px solid #e5e7eb', borderRadius: 8 }}>
			<table className="table table-modern" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
				<thead>
					<tr>
						<th style={firstHeaderCellStyle}>ETA</th>
						<th style={headerCellStyle}>Trạng thái</th>
						<th style={headerCellStyle} title="Chứng từ">📎</th>
						<th style={headerCellStyle} title="Chat">💬</th>
						<th style={headerCellStyle}>Hành động</th>
					</tr>
				</thead>
				<tbody>
					{data.map((item) => {
						// Demo data - Chỉ có supplement cho một số SCHEDULED orders (không phải tất cả)
						const demoItem = {
							...item,
							has_supplement_documents: item.has_supplement_documents || (item.status === 'SCHEDULED' && item.container_no === 'ISO 1234' ? true : false),
							last_supplement_update: item.last_supplement_update || (item.status === 'SCHEDULED' && item.container_no === 'ISO 1234' ? new Date(Date.now() - Math.random() * 86400000).toISOString() : null)
						};
						
						return (
						<tr key={item.id} className="table-row">
							<td style={firstColCellStyle}>
								<div className="eta-container-info">
									<div className="container-id">
										{item.container_no}
									</div>
									{item.eta ? (
										<div className="eta-date">
											{new Date(item.eta).toLocaleString('vi-VN')}
										</div>
									) : (
										<div className="eta-empty">-</div>
									)}
								</div>
							</td>
							<td>
								{getStatusBadge(item.status)}
							</td>
							<td>
								<div style={{ position: 'relative', display: 'inline-block' }}>
									{item.documents && item.documents.length > 0 ? (
										<button
											type="button"
											className="btn btn-icon"
											onClick={() => setOpenDocsId(openDocsId === item.id ? null : item.id)}
											title={`Xem ${item.documents.length} chứng từ`}
											aria-haspopup="menu"
											aria-expanded={openDocsId === item.id}
										>
											📎{item.documents.length > 1 ? ` ${item.documents.length}` : ''}
										</button>
									) : (
										<span className="no-document" title="Không có chứng từ">—</span>
									)}
									{openDocsId === item.id && item.documents && item.documents.length > 0 && (
										<div role="menu" style={{ position: 'absolute', right: 0, marginTop: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: 200, zIndex: 5 }}>
											{item.documents.map((doc: any) => (
												<button
													key={doc.id}
													role="menuitem"
													className="menu-item"
													style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }}
													onClick={() => { setOpenDocsId(null); onDocumentClick?.(doc); }}
													title={`Xem ${doc.name}`}
												>
													📄 {doc.name}
												</button>
											))}
										</div>
									)}
								</div>
							</td>

							<td>
								<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
									<DepotChatMini
										requestId={demoItem.id}
										containerNo={demoItem.container_no}
										requestType={demoItem.type}
										requestStatus={demoItem.status}
										hasSupplementDocuments={demoItem.has_supplement_documents}
										lastSupplementUpdate={demoItem.last_supplement_update}
										iconOnly
									/>
									{/* Indicator cho supplement documents */}
									{demoItem.has_supplement_documents && (
										<div style={{
											fontSize: '10px',
											color: '#f59e0b',
											background: '#fef3c7',
											padding: '2px 6px',
											borderRadius: '10px',
											border: '1px solid #f59e0b'
										}}>
											📋 Có tài liệu bổ sung
										</div>
									)}
								</div>
							</td>
							<td>
								<div style={{ position: 'relative', display: 'inline-block' }}>
									<button
										type="button"
										className="btn btn-icon"
										onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
										title="Hành động"
										aria-haspopup="menu"
										aria-expanded={openMenuId === item.id}
									>
										⋮
									</button>
									{openMenuId === item.id && (
										<div role="menu" style={{ position: 'absolute', right: 0, marginTop: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minWidth: 220, zIndex: 5 }}>
											{/* PENDING */}
											{item.status === 'PENDING' && (
												<>
													<button role="menuitem" className="menu-item" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }} disabled={loadingId === item.id + 'RECEIVED'} onClick={() => { setOpenMenuId(null); onChangeStatus?.(item.id, 'RECEIVED'); }}>
														{loadingId === item.id + 'RECEIVED' ? '⏳' : '✅'} Tiếp nhận
													</button>
													<button role="menuitem" className="menu-item" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }} disabled={loadingId === item.id + 'REJECTED'} onClick={() => { setOpenMenuId(null); onChangeStatus?.(item.id, 'REJECTED'); }}>
														{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
													</button>
												</>
											)}

											{/* SCHEDULED */}
											{item.status === 'SCHEDULED' && (
												<>
													<button role="menuitem" className="menu-item" title="Chuyển tiếp xử lý" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }} disabled={loadingId === item.id + 'FORWARDED'} onClick={() => { setOpenMenuId(null); onForward?.(item.id); }}>
														{loadingId === item.id + 'FORWARDED' ? '⏳' : '➡️'} Chuyển tiếp
													</button>
													<button role="menuitem" className="menu-item" title="Từ chối yêu cầu" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }} disabled={loadingId === item.id + 'REJECTED'} onClick={() => { setOpenMenuId(null); onReject?.(item.id); }}>
														{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
													</button>
												</>
											)}

											{/* RECEIVED */}
											{item.status === 'RECEIVED' && (
												<>
													<button role="menuitem" className="menu-item" title="Tiếp nhận và hoàn tất" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }} disabled={loadingId === item.id + 'COMPLETED'} onClick={() => { setOpenMenuId(null); onChangeStatus?.(item.id, 'COMPLETED'); }}>
														{loadingId === item.id + 'COMPLETED' ? '⏳' : '✅'} Tiếp nhận
													</button>
													<button role="menuitem" className="menu-item" title="Từ chối yêu cầu" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }} disabled={loadingId === item.id + 'REJECTED'} onClick={() => { setOpenMenuId(null); onChangeStatus?.(item.id, 'REJECTED'); }}>
														{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
													</button>
												</>
											)}

											{/* COMPLETED */}
											{item.status === 'COMPLETED' && (
												<>
													<button role="menuitem" className="menu-item" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }} disabled={loadingId === item.id + 'EXPORTED'} onClick={() => { setOpenMenuId(null); onChangeStatus?.(item.id, 'EXPORTED'); }}>
														{loadingId === item.id + 'EXPORTED' ? '⏳' : '📦'} Xuất kho
													</button>
													<button role="menuitem" className="menu-item" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px' }} disabled={loadingId === item.id + 'PAY'} onClick={() => { setOpenMenuId(null); onSendPayment?.(item.id); }}>
														{loadingId === item.id + 'PAY' ? '⏳' : '💰'} Thanh toán
													</button>
												</>
											)}

											{/* DELETE for terminal statuses */}
											{['REJECTED', 'COMPLETED', 'EXPORTED'].includes(item.status) && (
												<button role="menuitem" className="menu-item" title="Xóa khỏi danh sách Kho" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', color: '#b91c1c' }} disabled={loadingId === item.id + 'DELETE'} onClick={() => { if (window.confirm('Xóa khỏi danh sách Kho?\nRequest vẫn hiển thị trạng thái Từ chối bên Khách hàng.')) { setOpenMenuId(null); onSoftDelete?.(item.id, 'depot'); } }}>
													{loadingId === item.id + 'DELETE' ? '⏳' : '🗑️'} Xóa
												</button>
											)}
										</div>
									)}
								</div>
							</td>
						</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
