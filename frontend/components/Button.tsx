import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  loading = false,
  fullWidth = false
}: ButtonProps) {
  const baseClasses = 'btn';
  
  // Extended variant classes theo guidelines color palette
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info'
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };

  // Additional classes
  const additionalClasses = [];
  if (fullWidth) additionalClasses.push('btn-full-width');
  if (loading) additionalClasses.push('btn-loading');

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    ...additionalClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      style={fullWidth ? { width: '100%' } : undefined}
    >
      {loading && (
        <span className="btn-spinner" style={{ 
          marginRight: 'var(--space-2)',
          display: 'inline-block',
          width: '12px',
          height: '12px',
          border: '2px solid transparent',
          borderTop: '2px solid currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}>
        </span>
      )}
      {icon && !loading && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}


