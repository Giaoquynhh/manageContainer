import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export default function PageLayout({
  children,
  title,
  subtitle,
  actions,
  className = '',
  maxWidth = 'lg'
}: PageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl', 
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  const containerClasses = [
    'page-layout',
    maxWidthClasses[maxWidth],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {(title || subtitle || actions) && (
        <div className="page-header">
          <div className="page-header-content">
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div className="page-actions">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="page-content">
        {children}
      </div>
    </div>
  );
}
