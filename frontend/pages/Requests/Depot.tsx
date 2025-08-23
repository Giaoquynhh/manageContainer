import React, { useMemo } from 'react';
import Header from '@components/Header';
import useSWR from 'swr';
import { api } from '@services/api';
import Button from '@components/Button';
import AppointmentModal from '@components/AppointmentModal';
import AppointmentMini from '@components/appointment/AppointmentMini';
import SupplementDocuments from '@components/SupplementDocuments';
import DepotRequestTable from './components/DepotRequestTable';
import DocumentViewerModal from './components/DocumentViewerModal';
import { useDepotActions } from './hooks/useDepotActions';
import RequestsToolbar from './components/RequestsToolbar';

function PageHeader() {
    return (
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
    );
}

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function DepotRequests() {
	const [state, actions] = useDepotActions();

	// Build SWR key from current filters & pagination (server-side filtering)
	const swrKey = useMemo(() => {
		const params = new URLSearchParams();
		if (state.searchQuery) params.set('search', state.searchQuery);
		if (state.filterType !== 'all') params.set('type', state.filterType);
		if (state.filterStatus !== 'all') params.set('status', state.filterStatus);
		params.set('page', String(state.page));
		params.set('limit', String(state.limit));
		return `/requests?${params.toString()}`;
	}, [state.searchQuery, state.filterType, state.filterStatus, state.page, state.limit]);

	const { data, error, isLoading } = useSWR(swrKey, fetcher);

	const requestsWithActions = data?.data?.map((item: any) => ({
		...item,
		actions: {
			changeStatus: actions.changeStatus,
			sendPayment: actions.sendPayment,
			softDeleteRequest: actions.softDeleteRequest,
			restoreRequest: actions.restoreRequest,
			loadingId: state.loadingId,
			actLabel: {
				RECEIVED: 'Tiếp nhận',
				REJECTED: 'Từ chối',
				COMPLETED: 'Hoàn tất',
				EXPORTED: 'Đã xuất kho'
			}
		}
	}));

	return (
		<>
			<Header />
			<main className="container">
				{/* Page Header */}
				<PageHeader />

				{/* Toolbar (sticky) */}
				<RequestsToolbar
					searchQuery={state.searchQuery}
					onSearchDebounced={actions.setSearchQuery}
					filterType={state.filterType}
					onChangeType={actions.setFilterType}
					filterStatus={state.filterStatus}
					onChangeStatus={actions.setFilterStatus}
					onClear={actions.clearFilters}
				/>

				{/* Request Table with Actions */}
				<DepotRequestTable
					data={requestsWithActions}
					loading={isLoading}
					onDocumentClick={actions.handleDocumentClick}
					onToggleSupplement={actions.toggleSupplement}
					onForward={actions.handleForward}
					onReject={actions.handleReject}
					onChangeStatus={actions.changeStatus}
					onSendPayment={actions.sendPayment}
					onSoftDelete={(id: string, scope: string) => actions.softDeleteRequest(id, scope as 'depot' | 'customer')}
					loadingId={state.loadingId}
				/>

				{/* Pagination */}
				<div className="pagination-bar" aria-label="Phân trang" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
					<label htmlFor="pageSize" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<span>Kích thước trang</span>
						<select id="pageSize" value={state.limit} onChange={(e) => actions.setLimit(Number(e.target.value))}>
							<option value={10}>10</option>
							<option value={20}>20</option>
							<option value={50}>50</option>
							<option value={100}>100</option>
						</select>
					</label>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<Button variant="secondary" onClick={() => actions.setPage(state.page - 1)} disabled={state.page <= 1}>
							← Trước
						</Button>
						<span>Trang {state.page}</span>
						<Button
							variant="secondary"
							onClick={() => actions.setPage(state.page + 1)}
							disabled={Array.isArray(data?.data) ? data.data.length < state.limit : false}
						>
							Sau →
						</Button>
					</div>
				</div>

				{/* Status Message */}
				{state.msg && (
					<div className={`status-message ${state.msg.ok ? 'success' : 'error'}`}>
						{state.msg.text}
					</div>
				)}

				{/* Appointment Mini Windows */}
				{Array.from(state.activeAppointmentRequests).map((requestId, index) => {
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
							onClose={() => actions.handleAppointmentClose(requestId)}
							onSuccess={() => actions.handleAppointmentMiniSuccess(requestId)}
						/>
					);
				})}

				{/* Supplement Documents Windows */}
				{Array.from(state.activeSupplementRequests).map((requestId) => (
					<div key={requestId} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
						<div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
							<div className="p-4 border-b border-gray-200">
								<div className="flex justify-between items-center">
									<h2 className="text-xl font-bold">Tài liệu bổ sung</h2>
									<button
										onClick={() => actions.toggleSupplement(requestId)}
										className="text-gray-500 hover:text-gray-700 text-xl"
									>
										✕
									</button>
								</div>
							</div>
							<div className="p-4">
								<SupplementDocuments 
									requestId={requestId}
									onDocumentAction={() => {
										// Refresh data if needed
									}}
								/>
							</div>
						</div>
					</div>
				))}

				{/* Document Viewer Modal */}
				<DocumentViewerModal
					document={state.selectedDocument}
					visible={state.showImageModal}
					onClose={actions.closeDocumentModal}
				/>

				{/* Appointment Modal (Legacy - kept for compatibility) */}
				<AppointmentModal
					requestId={state.selectedRequestId}
					visible={state.showAppointmentModal}
					onClose={() => actions.setShowAppointmentModal(false)}
					onSuccess={actions.handleAppointmentSuccess}
				/>
			</main>
		</>
	);
}




