import React, { useState, useEffect } from 'react';
import DepotChatWindow from './DepotChatWindow';

interface DepotChatMiniProps {
	requestId: string;
	containerNo: string;
	requestType: string;
	requestStatus: string;
	// Thêm props để theo dõi thay đổi thông tin
	hasSupplementDocuments?: boolean;
	lastSupplementUpdate?: string;
	// Chat control props
	onClose?: () => void;
}

export default function DepotChatMini({
	requestId,
	containerNo,
	requestType,
	requestStatus,
	hasSupplementDocuments = false,
	lastSupplementUpdate,
	onClose
}: DepotChatMiniProps) {
	const [isOpen, setIsOpen] = useState(false); // Không tự động mở chat
	const [isMinimized, setIsMinimized] = useState(false);
	const [position, setPosition] = useState({ x: 20, y: 20 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	// Check if chat is allowed based on request status
	const isChatAllowed = requestStatus === 'SCHEDULED' || 
						 requestStatus === 'APPROVED' || 
						 requestStatus === 'IN_PROGRESS' || 
						 requestStatus === 'COMPLETED' || 
						 requestStatus === 'EXPORTED' ||
						 requestStatus === 'PENDING_ACCEPT'; // Thêm PENDING_ACCEPT

	// Handle drag functionality
	const handleMouseDown = (e: React.MouseEvent) => {
		if (isMinimized) return;
		setIsDragging(true);
		const rect = (e.target as HTMLElement).getBoundingClientRect();
		setDragOffset({
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		});
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!isDragging) return;
		setPosition({
			x: e.clientX - dragOffset.x,
			y: e.clientY - dragOffset.y
		});
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, dragOffset]);

	// Position chat window at bottom-right by default
	useEffect(() => {
		if (typeof window !== 'undefined') {
			setPosition({
				x: window.innerWidth - 420, // 400px width + 20px margin
				y: window.innerHeight - 520  // 500px height + 20px margin
			});
		}
	}, []);

	const handleClose = () => {
		setIsOpen(false);
		setIsMinimized(false);
		// Gọi callback từ parent component
		onClose?.();
	};

	// Mở chat khi component được mount (được gọi từ parent)
	useEffect(() => {
		setIsOpen(true);
	}, []);

	const handleMinimize = () => {
		setIsMinimized(true);
	};

	const handleRestore = () => {
		setIsMinimized(false);
	};

	// Nếu chat không được cho phép, không hiển thị gì
	if (!isChatAllowed) {
		return null;
	}

	// Minimized chat (showing as a small bar)
	if (isMinimized) {
		return (
			<div 
				className="depot-chat-mini-bar"
				style={{ left: position.x, top: position.y }}
				onMouseDown={handleMouseDown}
			>
				<div className="chat-mini-content">
					<span className="chat-mini-title">💬 {containerNo}</span>
					<div className="chat-mini-actions">
						<button onClick={handleRestore} className="chat-btn chat-restore">□</button>
						<button onClick={handleClose} className="chat-btn chat-close">×</button>
					</div>
				</div>
			</div>
		);
	}

	// Full chat window
	return (
		<div 
			className="depot-chat-window-container"
			style={{ left: position.x, top: position.y }}
		>
					<DepotChatWindow
						requestId={requestId}
						containerNo={containerNo}
						requestType={requestType}
						requestStatus={requestStatus}
						onClose={handleClose}
						onMinimize={handleMinimize}
						onMouseDown={handleMouseDown}
						hasSupplementDocuments={hasSupplementDocuments}
						lastSupplementUpdate={lastSupplementUpdate}
					/>
		</div>
	);
}
