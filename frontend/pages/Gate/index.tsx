import Header from '@components/Header';
import Card from '@components/Card';
import { useEffect, useState } from 'react';
import { gateApi, getGateDeviceId, setGateDeviceId } from '@services/gate';
import { api } from '@services/api';

export default function GatePage(){
	const [me, setMe] = useState<any>(null);
	const [code, setCode] = useState('');
	const [plate, setPlate] = useState('');
	const [result, setResult] = useState<any>(null);
const [msg, setMsg] = useState<string>('');
const [deviceId, setDeviceId] = useState<string>('');

	useEffect(()=>{ api.get('/auth/me').then(r=>setMe(r.data)).catch(()=>{}); }, []);
useEffect(()=>{
    const id = getGateDeviceId();
    if (!id) setGateDeviceId('device-local-demo');
    setDeviceId(getGateDeviceId() || '');
}, []);

	const lookup = async ()=>{
		setMsg(''); setResult(null);
		try{ const data = await gateApi.lookup(code.trim()); setResult(data); }catch(e:any){ setMsg(e?.response?.data?.message || 'Không tìm thấy lịch hẹn'); }
	};
	const checkin = async ()=>{
		if (!result) return;
		setMsg('');
		try{ const data = await gateApi.checkin(result.id, plate.trim()); setResult(data); setMsg('Check-in thành công'); }
		catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi check-in'); }
	};
	const checkout = async ()=>{
		if (!result) return;
		setMsg('');
		let pin: string|undefined;
		try{ pin = window.prompt('PIN trưởng ca (nếu yêu cầu):') || undefined; }catch{}
		try{ const data = await gateApi.checkout(result.id, pin); setResult(data); setMsg('Check-out thành công'); }
		catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi check-out'); }
	};
	const printIn = async ()=>{ if (!result) return; try{ await gateApi.print(result.id,'IN'); setMsg('Đã gửi lệnh in Gate IN'); }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi in'); } };
	const printOut = async ()=>{ if (!result) return; try{ await gateApi.print(result.id,'OUT'); setMsg('Đã gửi lệnh in Gate OUT'); }catch(e:any){ setMsg(e?.response?.data?.message || 'Lỗi in'); } };

	return (
		<>
			<Header />
			<main className="container">
				<Card title="Gate Mode">
                    <div className="grid" style={{gap:12}}>
                        <div className="grid" style={{gap:8}}>
                            <label style={{fontSize:12,color:'#334155'}}>Thiết bị Gate ID (local)</label>
                            <div style={{display:'flex',gap:8}}>
                                <input placeholder="vd: device-local-demo" value={deviceId} onChange={e=>setDeviceId(e.target.value)} />
                                <button className="btn" onClick={()=>{ setGateDeviceId(deviceId.trim()); setMsg(`Đã đặt Gate Device ID = ${deviceId.trim()}`); }}>Lưu</button>
                            </div>
                            <div style={{fontSize:12,color:'#475569'}}>Backend cần ENV GATE_DEVICE_IDS chứa ID này.</div>
                        </div>
						<div className="grid" style={{gap:8}}>
							<input placeholder="Mã lịch hẹn / Container / Request" value={code} onChange={e=>setCode(e.target.value)} />
							<button className="btn" onClick={lookup}>Đối chiếu</button>
						</div>
						{result && (
							<Card title={`Kết quả: ${result.container_no} - ${result.status}`}>
								<div className="grid" style={{gap:8}}>
									<input placeholder="Biển số xe" value={plate} onChange={e=>setPlate(e.target.value)} />
									<div style={{display:'flex', gap:8}}>
										{['RECEIVED','COMPLETED'].includes(result.status) && <button className="btn" onClick={checkin}>Check-in</button>}
										{result.status==='IN_YARD' && <>
											<button className="btn" onClick={checkout}>Check-out</button>
											<button className="btn" onClick={printIn}>In Gate IN</button>
										</>}
										{result.status==='LEFT_YARD' && <button className="btn" onClick={printOut}>In Gate OUT</button>}
									</div>
								</div>
							</Card>
						)}
						{msg && <div style={{marginTop:8, fontSize:13, color: '#1e3a8a'}}>{msg}</div>}
					</div>
				</Card>
			</main>
		</>
	);
}


