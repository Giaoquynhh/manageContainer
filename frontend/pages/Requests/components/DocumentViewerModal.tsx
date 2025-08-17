import React from 'react';

interface DocumentViewerModalProps {
	document: any;
	visible: boolean;
	onClose: () => void;
}

export default function DocumentViewerModal({ document, visible, onClose }: DocumentViewerModalProps) {
	if (!visible || !document) return null;

	const getFileUrl = (filename: string) => {
		return `/backend/requests/documents/${filename}`;
	};

	const isImageFile = (filename: string) => {
		const ext = filename.toLowerCase().split('.').pop();
		return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '');
	};

	const isPdfFile = (filename: string) => {
		const ext = filename.toLowerCase().split('.').pop();
		return ext === 'pdf';
	};

	const fileUrl = getFileUrl(document.storage_key);
	const isImage = isImageFile(document.storage_key);
	const isPdf = isPdfFile(document.storage_key);

	return (
		<div className="image-modal-overlay" onClick={onClose}>
			<div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="image-modal-header">
					<h3>{document.name}</h3>
					<button className="image-modal-close" onClick={onClose}>
						✕
					</button>
				</div>
				<div className="image-modal-body">
					{isImage ? (
						<img
							src={fileUrl}
							alt={document.name}
							className="document-image"
						/>
					) : isPdf ? (
						<div className="pdf-viewer">
							<iframe
								src={fileUrl}
								title={document.name}
								className="pdf-iframe"
								style={{
									width: '100%',
									height: '80vh',
									minHeight: '600px',
									border: 'none',
									borderRadius: '8px',
									boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
								}}
							/>
							<div className="pdf-info" style={{ marginTop: '15px', textAlign: 'center' }}>
								<p style={{ margin: '8px 0', fontSize: '16px', color: '#333', fontWeight: '500' }}>
									📄 {document.name}
								</p>
								<p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
									Kích thước: {(document.size / 1024).toFixed(1)} KB
								</p>
								<a
									href={fileUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="download-link"
									style={{
										display: 'inline-block',
										marginTop: '12px',
										padding: '10px 20px',
										backgroundColor: '#3b82f6',
										color: 'white',
										textDecoration: 'none',
										borderRadius: '8px',
										fontSize: '14px',
										fontWeight: '500',
										transition: 'background-color 0.2s',
										boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = '#2563eb';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = '#3b82f6';
									}}
								>
									📥 Tải xuống PDF
								</a>
							</div>
						</div>
					) : (
						<div className="document-preview">
							<div className="document-icon">📄</div>
							<p>File: {document.name}</p>
							<p>Kích thước: {(document.size / 1024).toFixed(1)} KB</p>
							<a
								href={fileUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="download-link"
							>
								Tải xuống file
							</a>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
