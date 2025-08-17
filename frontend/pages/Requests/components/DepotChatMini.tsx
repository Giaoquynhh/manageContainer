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
}

export default function DepotChatMini({
	requestId,
	containerNo,
	requestType,
	requestStatus,
	hasSupplementDocuments = false,
	lastSupplementUpdate
}: DepotChatMiniProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isMinimized, setIsMinimized] = useState(false);
	const [position, setPosition] = useState({ x: 20, y: 20 });
	const [isDragging, setIsDragging] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

	// Check if chat is allowed based on request status (allow SCHEDULED for demo)
	const isChatAllowed = requestStatus === 'SCHEDULED' || 
						 requestStatus === 'APPROVED' || 
						 requestStatus === 'IN_PROGRESS' || 
						 requestStatus === 'COMPLETED' || 
						 requestStatus === 'EXPORTED';

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

	const handleOpen = () => {
		setIsOpen(true);
		setIsMinimized(false);
	};

	const handleClose = () => {
		setIsOpen(false);
		setIsMinimized(false);
	};

	const handleMinimize = () => {
		setIsMinimized(true);
	};

	const handleRestore = () => {
		setIsMinimized(false);
	};

	// Chat trigger button (when closed)
	if (!isOpen) {
		return (
			<button
				onClick={handleOpen}
				className="depot-chat-mini-trigger"
				title={isChatAllowed ? "Mở chat với khách hàng" : "Chat chưa khả dụng"}
				disabled={!isChatAllowed}
			>
				{isChatAllowed ? (
					<>
						💬 Chat
						<span className="chat-status-indicator active"></span>
					</>
				) : (
					<>
						💬 Chat
						<span className="chat-status-indicator inactive"></span>
					</>
				)}
			</button>
		);
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
