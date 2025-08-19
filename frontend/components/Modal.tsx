import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  visible: boolean;
  onCancel: () => void;
  children: ReactNode;
  width?: number | string;
  maxWidth?: number | string;
  footer?: ReactNode;
  closable?: boolean;
  maskClosable?: boolean;
  centered?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Modal({ 
  title, 
  visible, 
  onCancel, 
  children, 
  width,
  maxWidth,
  footer,
  closable = true,
  maskClosable = true,
  centered = true,
  size = 'md',
  className = ''
}: ModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible && closable) {
        onCancel();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [visible, onCancel, closable]);

  if (!visible) return null;

  // Size presets theo guidelines
  const sizePresets = {
    sm: { width: '400px', maxWidth: '90vw' },
    md: { width: '600px', maxWidth: '90vw' },
    lg: { width: '800px', maxWidth: '95vw' },
    xl: { width: '1200px', maxWidth: '95vw' }
  };

  const modalStyle = {
    width: width || sizePresets[size].width,
    maxWidth: maxWidth || sizePresets[size].maxWidth
  };

  const overlayClasses = [
    'modal-overlay',
    centered ? 'modal-centered' : '',
    className
  ].filter(Boolean).join(' ');

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (maskClosable && e.target === e.currentTarget) {
      onCancel();
    }
  };

  const content = (
    <div className={overlayClasses} onClick={handleOverlayClick}>
      <div 
        className="modal-content" 
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {closable && (
            <button 
              className="modal-close" 
              onClick={onCancel}
              aria-label="Đóng modal"
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render qua portal để tránh bị clip bởi các container (vd: card với overflow hidden)
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(content, document.body);
  }
  return content;
}


