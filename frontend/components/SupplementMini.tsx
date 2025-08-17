import React, { useState, useEffect } from 'react';
import SupplementWindow from './SupplementWindow';

interface SupplementMiniProps {
  requestId: string;
  visible: boolean;
  onClose: () => void;
}

export default function SupplementMini({ requestId, visible, onClose }: SupplementMiniProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Tính toán vị trí ban đầu (góc phải dưới)
  useEffect(() => {
    if (visible && position.x === 0 && position.y === 0) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setPosition({
        x: windowWidth - 400 - 20, // 400px width + 20px margin
        y: windowHeight - 500 - 20  // 500px height + 20px margin
      });
    }
  }, [visible, position]);

  // Ngăn scroll body khi popup mở
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="supplement-mini-overlay"
        onClick={onClose}
      />
      
      {/* Popup Container */}
      <div
        className={`supplement-mini-container ${isMinimized ? 'minimized' : ''}`}
        style={{
          left: position.x,
          top: position.y,
          transform: isMinimized ? 'translateY(calc(100% - 40px))' : 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <SupplementWindow
          requestId={requestId}
          isMinimized={isMinimized}
          onMinimize={() => setIsMinimized(!isMinimized)}
          onClose={onClose}
        />
      </div>
    </>
  );
}
