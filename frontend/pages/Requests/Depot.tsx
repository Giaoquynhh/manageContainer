import React, { useState, useEffect } from 'react';
import Header from '@components/Header';
import useSWR, { mutate } from 'swr';
import { api } from '@services/api';
import Modal from '@components/Modal';
import Button from '@components/Button';
import RequestTable from '@components/RequestTable';
import SearchBar from '@components/SearchBar';
import AppointmentModal from '@components/AppointmentModal';
import AppointmentMini from '@components/appointment/AppointmentMini';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function DepotRequests() {
	const [searchQuery, setSearchQuery] = useState('');
	const [filterType, setFilterType] = useState('all');
	const [filterStatus, setFilterStatus] = useState('all');
	const [showAppointmentModal, setShowAppointmentModal] = useState(false);
	const [selectedRequestId, setSelectedRequestId] = useState<string>('');
	const [activeAppointmentRequests, setActiveAppointmentRequests] = useState<Set<string>>(new Set());
	const { data, error, isLoading } = useSWR('/requests?page=1&limit=20', fetcher);
	const [msg, setMsg] = useState<{ text: string; ok: boolean }|null>(null);
	const [loadingId, setLoadingId] = useState<string>('');
	const [me, setMe] = useState<any>(null);

	const actLabel: Record<string, string> = {
		RECEIVED: 'Tiếp nhận',
		REJECTED: 'Từ chối',
		COMPLETED: 'Hoàn tất',
		EXPORTED: 'Đã xuất kho'
	};

	// Load user info
	useEffect(() => {
		api.get('/auth/me').then(r => setMe(r.data)).catch(() => {});
	}, []);

	const changeStatus = async (id: string, status: string) => {
		setMsg(null);
		setLoadingId(id + status);
		try {
			let payload: any = { status };
			if (status === 'REJECTED') {
				const reason = window.prompt('Nhập lý do từ chối');
				if (!reason) {
					setLoadingId('');
					return;
				}
				payload.reason = reason;
				await api.patch(`/requests/${id}/status`, payload);
					} else if (status === 'RECEIVED') {
			// Open appointment mini for RECEIVED status
			setActiveAppointmentRequests(prev => {
				const newSet = new Set(prev).add(id);
				console.log('Opening AppointmentMini for request:', id, 'Active requests:', Array.from(newSet));
				return newSet;
			});
			setLoadingId('');
			return;
			} else {
				await api.patch(`/requests/${id}/status`, payload);
			}
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `${actLabel[status] || 'Cập nhật'} yêu cầu thành công`, ok: true });
		} catch (e: any) {
			setMsg({ text: `Không thể ${actLabel[status]?.toLowerCase() || 'cập nhật'}: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const handleAppointmentSuccess = () => {
		mutate('/requests?page=1&limit=20');
		setMsg({ text: 'Đã tiếp nhận yêu cầu và tạo lịch hẹn thành công!', ok: true });
	};

	const toggleAppointment = (requestId: string) => {
		setActiveAppointmentRequests(prev => {
			const newSet = new Set(prev);
			if (newSet.has(requestId)) {
				newSet.delete(requestId);
			} else {
				newSet.add(requestId);
			}
			return newSet;
		});
	};

	const handleAppointmentClose = (requestId: string) => {
		setActiveAppointmentRequests(prev => {
			const newSet = new Set(prev);
			newSet.delete(requestId);
			return newSet;
		});
	};

	const handleAppointmentMiniSuccess = (requestId: string) => {
		handleAppointmentClose(requestId);
		handleAppointmentSuccess();
	};

	const sendPayment = async (id: string) => {
		setMsg(null);
		setLoadingId(id + 'PAY');
		try {
			await api.post(`/requests/${id}/payment-request`, {});
			setMsg({ text: 'Đã gửi yêu cầu thanh toán', ok: true });
		} catch (e: any) {
			setMsg({ text: `Gửi yêu cầu thanh toán thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const softDeleteRequest = async (id: string, scope: 'depot' | 'customer') => {
		setMsg(null);
		setLoadingId(id + 'DELETE');
		try {
			await api.delete(`/requests/${id}?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `Đã xóa khỏi danh sách ${scope === 'depot' ? 'Kho' : 'Khách hàng'}`, ok: true });
		} catch (e: any) {
			setMsg({ text: `Xóa thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const restoreRequest = async (id: string, scope: 'depot' | 'customer') => {
		setMsg(null);
		setLoadingId(id + 'RESTORE');
		try {
			await api.post(`/requests/${id}/restore?scope=${scope}`);
			mutate('/requests?page=1&limit=20');
			setMsg({ text: `Đã khôi phục trong danh sách ${scope === 'depot' ? 'Kho' : 'Khách hàng'}`, ok: true });
		} catch (e: any) {
			setMsg({ text: `Khôi phục thất bại: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
		} finally {
			setLoadingId('');
		}
	};

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		// TODO: Implement search functionality
	};

	const handleFilterChange = (filter: string) => {
		setFilterType(filter);
		// TODO: Implement filter functionality
	};

	const handleStatusFilterChange = (status: string) => {
		setFilterStatus(status);
		// TODO: Implement status filter functionality
	};

	// Filter data based on search and filter
	const filteredData = data?.data?.filter((item: any) => {
		const matchesSearch = searchQuery === '' ||
			item.container_no.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesTypeFilter = filterType === 'all' || item.type === filterType;
		const matchesStatusFilter = filterStatus === 'all' || item.status === filterStatus;
		return matchesSearch && matchesTypeFilter && matchesStatusFilter;
	});

	// Add action buttons to each request
	const requestsWithActions = filteredData?.map((item: any) => ({
		...item,
		actions: {
			changeStatus,
			sendPayment,
			softDeleteRequest,
			restoreRequest,
			loadingId,
			actLabel
		}
	}));

	return (
		<>
			<Header />
			<main className="container">
				{/* Page Header */}
				<div className="page-header">
					<h1 className="page-title">Quản lý yêu cầu dịch vụ (Depot)</h1>
					<div className="page-actions">
						<Button
							variant="primary"
							icon="📊"
							onClick={() => window.print()}
						>
							Xuất báo cáo
						</Button>
					</div>
				</div>

				{/* Search and Filter */}
				<div className="search-bar">
					<div className="search-input-group">
						<span className="search-icon">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<circle cx="11" cy="11" r="8"></circle>
								<path d="m21 21-4.35-4.35"></path>
							</svg>
						</span>
						<input
							type="text"
							className="search-input"
							placeholder="Tìm kiếm theo mã container..."
							value={searchQuery}
							onChange={(e) => handleSearch(e.target.value)}
						/>
					</div>
					<select
						className="filter-select"
						value={filterType}
						onChange={(e) => handleFilterChange(e.target.value)}
					>
						<option value="all">Tất cả loại</option>
						<option value="IMPORT">Nhập</option>
						<option value="EXPORT">Xuất</option>
						<option value="CONVERT">Chuyển đổi</option>
					</select>
					<select
						className="filter-select"
						value={filterStatus}
						onChange={(e) => handleStatusFilterChange(e.target.value)}
					>
						<option value="all">Tất cả trạng thái</option>
						<option value="PENDING">Chờ xử lý</option>
						<option value="RECEIVED">Đã nhận</option>
						<option value="COMPLETED">Hoàn thành</option>
						<option value="EXPORTED">Đã xuất</option>
						<option value="REJECTED">Từ chối</option>
					</select>
				</div>

				{/* Request Table with Actions */}
				<DepotRequestTable
					data={requestsWithActions}
					loading={isLoading}
					userRole={me?.role || me?.roles?.[0]}
				/>

				{/* Status Message */}
				{msg && (
					<div className={`status-message ${msg.ok ? 'success' : 'error'}`}>
						{msg.text}
					</div>
				)}

				{/* Appointment Mini Windows */}
				{Array.from(activeAppointmentRequests).map((requestId, index) => {
					const request = data?.data?.find((r: any) => r.id === requestId);
					if (!request) return null;
					
					return (
						<AppointmentMini
							key={requestId}
							requestId={requestId}
							requestData={{
								id: request.id,
								container_no: request.container_no,
								type: request.type,
								status: request.status,
								created_by: request.created_by
							}}
							onClose={() => handleAppointmentClose(requestId)}
							onSuccess={() => handleAppointmentMiniSuccess(requestId)}
						/>
					);
				})}

				{/* Appointment Modal (Legacy - kept for compatibility) */}
				<AppointmentModal
					requestId={selectedRequestId}
					visible={showAppointmentModal}
					onClose={() => setShowAppointmentModal(false)}
					onSuccess={handleAppointmentSuccess}
				/>
			</main>
		</>
	);
}

// Custom Depot Request Table Component
function DepotRequestTable({ data, loading }: { data?: any[]; loading?: boolean }) {
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
						<th>Loại</th>
						<th>Container</th>
						<th>ETA</th>
						<th>Trạng thái</th>
						<th>Chứng từ</th>
						<th>Mã tra cứu Gate</th>
						<th>Chat</th>
						<th>Hành động</th>
					</tr>
				</thead>
				<tbody>
					{data.map((item) => (
						<tr key={item.id} className="table-row">
							<td>
								<span className="type-label">
									{getTypeLabel(item.type)}
								</span>
							</td>
							<td>
								<span className="container-id">
									{item.container_no}
								</span>
							</td>
							<td>
								{item.eta ? (
									<span className="eta-date">
										{new Date(item.eta).toLocaleString('vi-VN')}
									</span>
								) : (
									<span className="eta-empty">-</span>
								)}
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
												onClick={() => {
													// TODO: Implement document viewer
													window.open(`/backend/requests/documents/${doc.storage_key}`, '_blank');
												}}
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
								<div className="gate-lookup">
									<span className="gate-code">{item.container_no}</span>
									<button
										className="btn btn-sm btn-outline"
										onClick={() => {
											try {
												navigator.clipboard.writeText(item.container_no);
												// TODO: Show success message
											} catch {}
										}}
									>
										Sao chép
									</button>
								</div>
							</td>
							<td>
								<button
									className="btn btn-sm btn-outline"
									onClick={() => {
										// TODO: Implement chat functionality
										alert('Chat feature coming soon!');
									}}
									title="Mở chat"
								>
									💬 Chat
								</button>
							</td>
							<td>
								<div className="action-buttons">
									{item.status === 'PENDING' && (
										<button
											className="btn btn-sm btn-primary"
											disabled={item.actions.loadingId === item.id + 'RECEIVED'}
											onClick={() => item.actions.changeStatus(item.id, 'RECEIVED')}
										>
											{item.actions.loadingId === item.id + 'RECEIVED' ? '⏳' : '✅'} Tiếp nhận
										</button>
									)}
									{(item.status === 'PENDING' || item.status === 'RECEIVED') && (
										<button
											className="btn btn-sm btn-danger"
											disabled={item.actions.loadingId === item.id + 'REJECTED'}
											onClick={() => item.actions.changeStatus(item.id, 'REJECTED')}
										>
											{item.actions.loadingId === item.id + 'REJECTED' ? '⏳' : '❌'} Từ chối
										</button>
									)}
									{item.status === 'RECEIVED' && (
										<button
											className="btn btn-sm btn-success"
											disabled={item.actions.loadingId === item.id + 'COMPLETED'}
											onClick={() => item.actions.changeStatus(item.id, 'COMPLETED')}
										>
											{item.actions.loadingId === item.id + 'COMPLETED' ? '⏳' : '✅'} Hoàn tất
										</button>
									)}
									{(item.status === 'RECEIVED' || item.status === 'COMPLETED') && (
										<button
											className="btn btn-sm btn-warning"
											disabled={item.actions.loadingId === item.id + 'EXPORTED'}
											onClick={() => item.actions.changeStatus(item.id, 'EXPORTED')}
										>
											{item.actions.loadingId === item.id + 'EXPORTED' ? '⏳' : '📦'} Xuất kho
										</button>
									)}
									{item.status === 'COMPLETED' && (
										<button
											className="btn btn-sm btn-info"
											disabled={item.actions.loadingId === item.id + 'PAY'}
											onClick={() => item.actions.sendPayment(item.id)}
										>
											{item.actions.loadingId === item.id + 'PAY' ? '⏳' : '💰'} Thanh toán
										</button>
									)}
									{/* Soft delete buttons */}
									{['REJECTED', 'COMPLETED', 'EXPORTED'].includes(item.status) && (
										<button
											className="btn btn-sm btn-outline"
											disabled={item.actions.loadingId === item.id + 'DELETE'}
											onClick={() => {
												if (window.confirm('Xóa khỏi danh sách Kho?\nRequest vẫn hiển thị trạng thái Từ chối bên Khách hàng.')) {
													item.actions.softDeleteRequest(item.id, 'depot');
												}
											}}
											title="Xóa khỏi danh sách Kho"
										>
											{item.actions.loadingId === item.id + 'DELETE' ? '⏳' : '🗑️'} Xóa
										</button>
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}




