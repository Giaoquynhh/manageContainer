// Base Components
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Header } from './Header';
export { default as Modal } from './Modal';
export { default as SearchBar } from './SearchBar';

// Layout Components
export { default as PageLayout } from './layout/PageLayout';

// UI Components
export { default as Badge } from './ui/Badge';
export { default as LoadingSpinner } from './ui/LoadingSpinner';

// Chat Components
export { default as ChatMini } from './chat/ChatMini';
export { default as ChatWindow } from './chat/ChatWindow';
export { default as ChatWindowStandalone } from './chat/ChatWindowStandalone';
export { default as ChatHeader } from './chat/ChatHeader';
export { default as ChatMessage } from './chat/ChatMessage';
export { default as ChatInput } from './chat/ChatInput';

// Appointment Components
export { default as AppointmentMini } from './appointment/AppointmentMini';
export { default as AppointmentWindow } from './appointment/AppointmentWindow';
export { default as AppointmentHeader } from './appointment/AppointmentHeader';
export { default as AppointmentForm } from './appointment/AppointmentForm';

// Legacy Components (giữ lại để không break existing imports)
export { default as AppointmentModal } from './AppointmentModal';
export { default as ChatBox } from './ChatBox';
export { default as RequestForm } from './RequestForm';
export { default as RequestTable } from './RequestTable';
export { default as SimpleChatBox } from './SimpleChatBox';
export { default as SimpleChatBoxNew } from './SimpleChatBoxNew';
export { default as UploadModal } from './UploadModal';
