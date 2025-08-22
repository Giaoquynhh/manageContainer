import React from 'react';
import DepotChatMini from './DepotChatMini';

interface DepotRequestTableProps {
	data?: any[];
	loading?: boolean;
	onDocumentClick?: (doc: any) => void;
	onToggleSupplement?: (requestId: string) => void;
	onChangeAppointment?: (requestId: string) => void;
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
	onChangeAppointment,
	onReject,
	onChangeStatus,
	onSendPayment,
	onSoftDelete,
	loadingId 
}: DepotRequestTableProps) {
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
		<div className="table-container">
			<table className="table table-modern">
				<thead>
					<tr>
						<th>ETA</th>
						<th>Trạng thái</th>
						<th>Chứng từ</th>
						<th>Chat</th>
						<th>Hành động</th>
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
							<td>
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
								{item.documents && item.documents.length > 0 ? (
									<div className="document-badges">
										{item.documents.map((doc: any) => (
											<button
												key={doc.id}
												className="document-badge clickable"
												onClick={() => onDocumentClick?.(doc)}
												title={`Xem ${doc.name}`}
											>
												📎 {doc.name}
											</button>
										))}
									</div>
								) : (
									<span className="no-document">-</span>
								)}
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
								<div className="action-buttons">
									{item.status === 'PENDING' && (
										<button
											className="btn btn-sm btn-primary"
											disabled={loadingId === item.id + 'RECEIVED'}
											onClick={() => onChangeStatus?.(item.id, 'RECEIVED')}
										>
											{loadingId === item.id + 'RECEIVED' ? '⏳' : '✅'} Tiếp nhận
										</button>
									)}
									{item.status === 'SCHEDULED' && (
										<>
											<button
												className="btn btn-sm btn-success"
												onClick={() => onChangeAppointment?.(item.id)}
												title="Thay đổi lịch hẹn với khách hàng"
											>
												📅 Thay đổi lịch hẹn
											</button>
											<button
												className="btn btn-sm btn-danger"
												disabled={loadingId === item.id + 'REJECTED'}
												onClick={() => onReject?.(item.id)}
												title="Từ chối yêu cầu"
											>
												{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
											</button>
										</>
									)}
									{(item.status === 'PENDING' || item.status === 'RECEIVED') && (
										<button
											className="btn btn-sm btn-danger"
											disabled={loadingId === item.id + 'REJECTED'}
											onClick={() => onChangeStatus?.(item.id, 'REJECTED')}
										>
											{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
										</button>
									)}
									{item.status === 'RECEIVED' && (
										<>
											<button
												className="btn btn-sm btn-success"
												disabled={loadingId === item.id + 'COMPLETED'}
												onClick={() => onChangeStatus?.(item.id, 'COMPLETED')}
												title="Tiếp nhận và hoàn tất"
											>
												{loadingId === item.id + 'COMPLETED' ? '⏳' : '✅'} Tiếp nhận
											</button>
											<button
												className="btn btn-sm btn-danger"
												disabled={loadingId === item.id + 'REJECTED'}
												onClick={() => onChangeStatus?.(item.id, 'REJECTED')}
												title="Từ chối yêu cầu"
											>
												{loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
											</button>
										</>
									)}
									{item.status === 'COMPLETED' && (
										<button
											className="btn btn-sm btn-warning"
											disabled={loadingId === item.id + 'EXPORTED'}
											onClick={() => onChangeStatus?.(item.id, 'EXPORTED')}
										>
											{loadingId === item.id + 'EXPORTED' ? '⏳' : '📦'} Xuất kho
										</button>
									)}
									{item.status === 'COMPLETED' && (
										<button
											className="btn btn-sm btn-info"
											disabled={loadingId === item.id + 'PAY'}
											onClick={() => onSendPayment?.(item.id)}
										>
											{loadingId === item.id + 'PAY' ? '⏳' : '💰'} Thanh toán
										</button>
									)}
									{/* Soft delete buttons */}
									{['REJECTED', 'COMPLETED', 'EXPORTED'].includes(item.status) && (
										<button
											className="btn btn-sm btn-outline"
											disabled={loadingId === item.id + 'DELETE'}
											onClick={() => {
												if (window.confirm('Xóa khỏi danh sách Kho?\nRequest vẫn hiển thị trạng thái Từ chối bên Khách hàng.')) {
													onSoftDelete?.(item.id, 'depot');
												}
											}}
											title="Xóa khỏi danh sách Kho"
										>
											{loadingId === item.id + 'DELETE' ? '⏳' : '🗑️'} Xóa
										</button>
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
