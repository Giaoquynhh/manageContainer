import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { canViewUsersPartners, isSaleAdmin, isAccountant, canUseGate, isSystemAdmin, isBusinessAdmin, isYardManager, isMaintenanceManager, isSecurity, isCustomerRole } from '@utils/rbac';
import { api } from '@services/api';

interface User {
  email?: string;
  role?: string;
}

export default function Header() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [me, setMe] = useState<User | null>(null);
  const [navOpen, setNavOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // Initialize auth state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const hasValidToken = !!token;
      setHasToken(hasValidToken);

      if (hasValidToken) {
        api.get('/auth/me')
          .then(response => {
            setMe({
              email: response.data?.email,
              role: response.data?.role || response.data?.roles?.[0]
            });
          })
          .catch(() => {
            // Token might be invalid, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            setHasToken(false);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }

      // Restore sidebar state
      try {
        const savedNavState = localStorage.getItem('nav_open');
        if (savedNavState !== null) {
          setNavOpen(savedNavState === '1');
        }
      } catch (error) {
        console.warn('Failed to restore nav state:', error);
      }
    }
  }, []);

  // Handle sidebar state changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const shouldShowSidebar = hasToken && 
        router.pathname !== '/Login' && 
        router.pathname !== '/Register';
      
      document.body.classList.toggle('with-sidebar', shouldShowSidebar && navOpen);
      
      try {
        localStorage.setItem('nav_open', navOpen ? '1' : '0');
      } catch (error) {
        console.warn('Failed to save nav state:', error);
      }
    }
  }, [navOpen, hasToken, router.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountDropdownOpen) {
        setAccountDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [accountDropdownOpen]);

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        setHasToken(false);
        setMe(null);
        window.location.href = '/Login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect anyway
      window.location.href = '/Login';
    }
  };

  const toggleNavigation = () => {
    setNavOpen(prev => !prev);
  };

  const toggleAccountDropdown = () => {
    setAccountDropdownOpen(prev => !prev);
  };

  // Component state calculations
  const showLogout = hasToken && router.pathname !== '/Login';
  const showSidebar = hasToken && router.pathname !== '/Login' && router.pathname !== '/Register';

  // Debug logging
  useEffect(() => {
    console.log('🔍 Debug Header State:', {
      hasToken,
      showSidebar,
      navOpen,
      userRole: me?.role,
      pathname: router.pathname,
      canUseGate: canUseGate(me?.role),
      isSecurity: isSecurity(me?.role)
    });
  }, [hasToken, showSidebar, navOpen, me?.role, router.pathname]);

  return (
    <header className="header">
      <div className="container header-inner">
        {/* Navigation Toggle Button */}
        {showSidebar && (
          <button 
            className="nav-toggle" 
            onClick={toggleNavigation}
            title={navOpen ? 'Đóng menu' : 'Mở menu'}
            aria-label={navOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={navOpen}
          >
            <span className="nav-toggle-icon">
              {navOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </span>
          </button>
        )}

        {/* Brand Section */}
        <div className="header-brand">
          <Link href="/" className="header-logo-link">
            <Image 
              src="/sml_logo.png" 
              alt="Smartlog Container Manager" 
              width={120} 
              height={32} 
              className="logo"
              priority
            />
          </Link>
          <h1 className="header-title">Smartlog Container Manager</h1>
        </div>

        {/* User Actions Section */}
        <div className="header-actions">
          {/* User Info */}
          {me?.role && !isLoading && (
            <div className="user-info">
              <span className="user-role">({me.role})</span>
              <span className="user-email">{me.email}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="user-loading">
              <div className="loading-spinner-small"></div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="header-buttons">
            {/* Account Dropdown */}
            {showLogout && (
              <div className="account-dropdown-container">
                <button 
                  className="btn btn-outline header-account-btn" 
                  onClick={toggleAccountDropdown}
                  type="button"
                  title="Quản lý tài khoản"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Tài khoản</span>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      transform: accountDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                
                {/* Account Dropdown Menu */}
                {accountDropdownOpen && (
                  <div className="account-dropdown-menu">
                    <Link 
                      href="/Account" 
                      className="dropdown-item"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>Thông tin tài khoản</span>
                    </Link>
                    
                    {canViewUsersPartners(me?.role) && (
                      <Link 
                        href="/UsersPartners" 
                        className="dropdown-item"
                        onClick={() => setAccountDropdownOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>Quản lý người dùng</span>
                      </Link>
                    )}
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item dropdown-item-danger" 
                      onClick={handleLogout}
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {!hasToken && router.pathname !== '/Login' && (
              <Link 
                className="btn btn-outline header-login-btn" 
                href="/Login"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10,17 15,12 10,7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Sidebar Navigation */}
      {showSidebar && (
        <nav className={`sidebar${navOpen ? '' : ' closed'}`} role="navigation" aria-label="Menu chính">
          <div className="sidebar-content">
            
            {/* Users & Partners Module */}
            {canViewUsersPartners(me?.role) && (
              <Link className="sidebar-link" href="/UsersPartners">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Người dùng/Đối tác</span>
              </Link>
            )}

            {/* Requests Module */}
            {(isSaleAdmin(me?.role) || isAccountant(me?.role) || isSystemAdmin(me?.role) || isBusinessAdmin(me?.role)) && (
              <Link className="sidebar-link" href="/Requests/Depot">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>Yêu cầu (Depot)</span>
              </Link>
            )}
            
            {isCustomerRole(me?.role) && (
              <Link className="sidebar-link" href="/Requests/Customer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                </svg>
                <span>Yêu cầu (Khách hàng)</span>
              </Link>
            )}

            {/* Gate Module */}
            {(canUseGate(me?.role) || isSecurity(me?.role)) && (
              <Link className="sidebar-link" href="/Gate">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Cổng (Gate)</span>
              </Link>
            )}

            {/* Yard & Containers Module */}
            {(isSaleAdmin(me?.role) || isYardManager(me?.role) || isSystemAdmin(me?.role)) && (
              <>
                <Link className="sidebar-link" href="/Yard">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  <span>Bãi (Yard)</span>
                </Link>
                <Link className="sidebar-link" href="/Reports/containers">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"></path>
                    <path d="M3.27 6.96L12 12.01l8.73-5.05"></path>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  <span>Container</span>
                </Link>
              </>
            )}

            {/* Forklift Module - Xe nâng */}
            {(isSaleAdmin(me?.role) || isYardManager(me?.role) || isSystemAdmin(me?.role)) && (
              <Link className="sidebar-link" href="/Forklift">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <circle cx="6" cy="6" r="1"></circle>
                  <circle cx="18" cy="6" r="1"></circle>
                </svg>
                <span>Xe nâng</span>
              </Link>
            )}

            {/* Maintenance Module */}
            {(isSaleAdmin(me?.role) || isMaintenanceManager(me?.role) || isSystemAdmin(me?.role)) && (
              <>
                <Link className="sidebar-link" href="/Maintenance/Repairs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  <span>Bảo trì - Phiếu sửa chữa</span>
                </Link>
                <Link className="sidebar-link" href="/Maintenance/Inventory">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
                  <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
                  <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                  <span>Bảo trì - Tồn kho</span>
                </Link>
              </>
            )}

            {/* Finance Module */}
            {(isSaleAdmin(me?.role) || isAccountant(me?.role) || isSystemAdmin(me?.role)) && (
              <>
                <Link className="sidebar-link" href="/finance/invoices">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  <span>Tài chính - Hóa đơn</span>
                </Link>
                <Link className="sidebar-link" href="/finance/invoices/new">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  <span>Tài chính - Tạo hóa đơn</span>
                </Link>
              </>
            )}

            {/* Reports Module */}
            <Link className="sidebar-link" href="/Reports">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 17H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"></path>
                <path d="M15 17h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"></path>
                <path d="M12 3v18"></path>
                <path d="M9 9h6"></path>
                <path d="M9 13h6"></path>
              </svg>
              <span>Báo cáo</span>
            </Link>

            {/* Account */}
            <Link className="sidebar-link" href="/Account">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Tài khoản</span>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
