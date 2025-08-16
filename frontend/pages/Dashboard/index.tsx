import Header from '@components/Header';
import Card from '@components/Card';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@services/api';
import { canViewUsersPartners, isCustomerRole, isSaleAdmin, isAccountant, canUseGate } from '@utils/rbac';

export default function Dashboard(){
	const [me, setMe] = useState<any>(null);
    useEffect(()=>{ api.get('/auth/me').then(r=>setMe(r.data)).catch(()=>{}); }, []);
    // Auto-redirect to the first available option after login (unless ?stay=1)
    useEffect(()=>{
        if (!me) return;
        const role = me?.role || me?.roles?.[0];
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        if (params.get('stay') === '1') return;
        const firstRoute = (()=>{
            if (canViewUsersPartners(role)) return '/UsersPartners';
            if (isCustomerRole(role)) return '/Requests/Customer';
            if (isSaleAdmin(role) || isAccountant(role)) return '/Requests/Depot';
            if (canUseGate(role)) return '/Gate';
            if (isSaleAdmin(role)) return '/Yard';
            return '/Account';
        })();
        if (window.location.pathname === '/Dashboard') {
            window.location.replace(firstRoute);
        }
    }, [me]);
	const role = me?.role || me?.roles?.[0];
	return (
		<>
			<Header />
            <main className="container">
                <Card title={`Chào ${me?.full_name || ''} (${role || '...'})`}>
                    <div className="grid grid-cols-3" style={{gap:20}}>
						{canViewUsersPartners(role) && (
                            <Card title="Quản lý người dùng & đối tác" actions={<Link className="btn" href="/UsersPartners">Mở</Link>}>
								Tạo/mời user, quản lý khách hàng/đối tác.
							</Card>
						)}
						{isCustomerRole(role) && (
							<Card title="Yêu cầu dịch vụ (Khách hàng)" actions={<Link className="btn" href="/Requests/Customer">Mở</Link>}>
								Tạo và theo dõi yêu cầu của công ty bạn.
							</Card>
						)}
						{(isSaleAdmin(role) || isAccountant(role)) && (
							<Card title="Yêu cầu dịch vụ (Depot)" actions={<Link className="btn" href="/Requests/Depot">Mở</Link>}>
								Tiếp nhận/từ chối, upload chứng từ, gửi yêu cầu thanh toán.
							</Card>
						)}
					{canUseGate(role) && (
						<Card title="Cổng vào/ra (Gate Mode)" actions={<Link className="btn" href="/Gate">Mở</Link>}>
							Quét/đối chiếu, check-in, check-out, in phiếu.
						</Card>
					)}
					{isSaleAdmin(role) && (
						<Card title="Điều độ bãi" actions={<Link className="btn" href="/Yard">Mở</Link>}>
							Sơ đồ bãi, gợi ý & gán vị trí, quản lý công việc xe nâng.
						</Card>
					)}
					{isSaleAdmin(role) && (
                        <Card title="Bảo trì & Vật tư" actions={<div style={{display:'flex',gap:8}}>
							<Link className="btn" href="/Maintenance/Repairs">Phiếu sửa chữa</Link>
							<Link className="btn" href="/Maintenance/Inventory">Tồn kho</Link>
						</div>}>
							Tạo/duyệt phiếu sửa chữa; quản lý tồn kho vật tư.
						</Card>
					)}
					{isSaleAdmin(role) && (
                        <Card title="Tài chính & Hóa đơn" actions={<div style={{display:'flex',gap:8}}>
							<Link className="btn" href="/finance/invoices">Danh sách Hóa đơn</Link>
							<Link className="btn" href="/finance/invoices/new">Tạo hóa đơn</Link>
						</div>}>
							Phát hành hóa đơn, ghi nhận thanh toán, theo dõi công nợ.
						</Card>
					)}
						<Card title="Tài khoản cá nhân" actions={<Link className="btn" href="/Account">Mở</Link>}>
							Xem/Cập nhật hồ sơ, đổi mật khẩu.
						</Card>
					</div>
				</Card>
			</main>
		</>
	);
}
