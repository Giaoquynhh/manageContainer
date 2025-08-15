import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { canViewUsersPartners, isSaleAdmin, isAccountant, canUseGate, isSystemAdmin, isBusinessAdmin, isYardManager, isMaintenanceManager, isSecurity, isCustomerRole } from '@utils/rbac';
import { api } from '@services/api';

export default function Header(){
	const router = useRouter();
	const [hasToken, setHasToken] = useState(false);
	const [me, setMe] = useState<{ email?: string; role?: string }|null>(null);
	const [navOpen, setNavOpen] = useState(true);
	useEffect(()=>{
		if (typeof window !== 'undefined'){
			const tok = !!localStorage.getItem('token');
			setHasToken(tok);
			if (tok) api.get('/auth/me').then(r=>setMe({ email: r.data?.email, role: r.data?.role || r.data?.roles?.[0] })).catch(()=>{});
			try{ const saved = localStorage.getItem('nav_open'); if (saved !== null) setNavOpen(saved === '1'); }catch{}
		}
	}, []);

	useEffect(()=>{
		if (typeof document !== 'undefined'){
			const shouldShowSidebar = hasToken && router.pathname !== '/Login' && router.pathname !== '/Register';
			document.body.classList.toggle('with-sidebar', navOpen && shouldShowSidebar);
			try{ localStorage.setItem('nav_open', navOpen ? '1' : '0'); }catch{}
		}
	}, [navOpen, hasToken, router.pathname]);

	const onLogout = () => {
		try{
			if (typeof window !== 'undefined'){
				localStorage.removeItem('token');
				localStorage.removeItem('refresh_token');
				window.location.href = '/Login';
			}
		}catch{}
	};
    const showLogout = hasToken && router.pathname !== '/Login';
    const showUsersLink = canViewUsersPartners(me?.role);
    const showSidebar = hasToken && router.pathname !== '/Login' && router.pathname !== '/Register';
    return (
        <header className="header">
            <div className="container header-inner" style={{justifyContent:'space-between'}}>
                {showSidebar && (
                    <button className="nav-toggle" onClick={()=>setNavOpen(o=>!o)} title={navOpen? 'Đóng menu' : 'Mở menu'}>
                        {navOpen ? '✕' : '☰'}
                    </button>
                )}
				<div style={{display:'flex',alignItems:'center',gap:12}}>
                    <Link href="/">
                        <Image src="/sml_logo.png" alt="Smartlog" width={120} height={32} className="logo"/>
                    </Link>
                    <div className="title">Smartlog Container Manager</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                    {me?.role && <span style={{color:'#fff',opacity:.9,fontSize:12}}>({me.role}) {me.email}</span>}
                    {showLogout && <button className="btn" onClick={onLogout} style={{background:'#fff',color:'#0a2558'}}>Đăng xuất</button>}
                    {!hasToken && router.pathname !== '/Login' && <Link className="btn" href="/Login" style={{background:'#fff',color:'#0a2558'}}>Đăng nhập</Link>}
                </div>
            </div>
            {showSidebar && (
              <nav className={`sidebar${navOpen ? '' : ' closed'}`}>
                {/* Module 1 & 9: Users & Partners */}
                {canViewUsersPartners(me?.role) && <Link className="sidebar-link" href="/UsersPartners">Người dùng/Đối tác</Link>}

                {/* Module 3: Requests */}
                {(isSaleAdmin(me?.role) || isAccountant(me?.role) || isSystemAdmin(me?.role) || isBusinessAdmin(me?.role)) && (
                  <Link className="sidebar-link" href="/Requests/Depot">Yêu cầu (Depot)</Link>
                )}
                {isCustomerRole(me?.role) && (
                  <Link className="sidebar-link" href="/Requests/Customer">Yêu cầu (Khách hàng)</Link>
                )}

                {/* Module 4: Gate */}
                {(canUseGate(me?.role) || isSecurity(me?.role)) && (
                  <Link className="sidebar-link" href="/Gate">Cổng (Gate)</Link>
                )}

                {/* Module 5: Yard & Containers */}
                {(isSaleAdmin(me?.role) || isYardManager(me?.role) || isSystemAdmin(me?.role)) && (
                  <>
                    <Link className="sidebar-link" href="/Yard">Bãi (Yard)</Link>
                    <Link className="sidebar-link" href="/Reports/containers">Container</Link>
                  </>
                )}

                {/* Module 6: Maintenance */}
                {(isSaleAdmin(me?.role) || isMaintenanceManager(me?.role) || isSystemAdmin(me?.role)) && (
                  <>
                    <Link className="sidebar-link" href="/Maintenance/Repairs">Bảo trì - Phiếu sửa chữa</Link>
                    <Link className="sidebar-link" href="/Maintenance/Inventory">Bảo trì - Tồn kho</Link>
                  </>
                )}

                {/* Module 7: Finance */}
                {(isSaleAdmin(me?.role) || isAccountant(me?.role) || isSystemAdmin(me?.role)) && (
                  <>
                    <Link className="sidebar-link" href="/finance/invoices">Tài chính - Hóa đơn</Link>
                    <Link className="sidebar-link" href="/finance/invoices/new">Tài chính - Tạo hóa đơn</Link>
                  </>
                )}

                {/* Module 8: Reports */}
                <Link className="sidebar-link" href="/Reports">Báo cáo</Link>

                {/* Account */}
                <Link className="sidebar-link" href="/Account">Tài khoản</Link>
              </nav>
            )}
        </header>
    );
}
