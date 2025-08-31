import Header from '@components/Header';
import Card from '@components/Card';
import useSWR, { mutate } from 'swr';
import { yardApi } from '@services/yard';
import { useMemo, useState } from 'react';
import { YardMap, StackDetailsModal } from '@components/yard';
import { useTranslation } from '../../hooks/useTranslation';

// Dùng stack map mới
const fetcher = async () => yardApi.stackMap();

export default function YardPage() {
  const { data: map } = useSWR('yard_map', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: false,
    dedupingInterval: 3000,
  });
  const [activeSlot, setActiveSlot] = useState<{ id: string; code: string } | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [searchContainer, setSearchContainer] = useState('');
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const { t } = useTranslation();
  
  // UI mới: chỉ hiển thị bản đồ bãi từ stack map

  // Transform data cho YardMap component
  const transformMapData = (mapData: any) => {
    if (!mapData) return null;
    
    return mapData.map((yard: any) => ({
      ...yard,
      blocks: yard.blocks.map((block: any) => ({
        ...block,
        slots: block.slots.map((slot: any) => {
          const baseStatus = slot.status as string | undefined;
          let status = 'EMPTY';
          if (baseStatus === 'UNDER_MAINTENANCE' || baseStatus === 'EXPORT') {
            status = baseStatus as any;
          } else if (slot.occupied_count && slot.occupied_count > 0) {
            status = 'OCCUPIED';
          } else if (slot.hold_count && slot.hold_count > 0) {
            status = 'RESERVED';
          } else {
            status = 'EMPTY';
          }
          return {
            ...slot,
            status,
            isSuggested: false,
            isSelected: false
          };
        })
      }))
    }));
  };

  const transformedMap = transformMapData(map);
  const isLoading = map === undefined;
  const isEmpty = Array.isArray(transformedMap) && transformedMap.length === 0;

  const stats = useMemo(() => {
    if (!transformedMap) return { totalBlocks: 0, totalSlots: 0, totalOcc: 0, totalHold: 0 };
    const yard = transformedMap[0];
    let totalSlots = 0, totalOcc = 0, totalHold = 0;
    (yard?.blocks || []).forEach((b: any) => {
      totalSlots += (b?.slots || []).length;
      (b?.slots || []).forEach((s: any) => {
        totalOcc += s?.occupied_count || 0;
        totalHold += s?.hold_count || 0;
      });
    });
    return { totalBlocks: (yard?.blocks || []).length, totalSlots, totalOcc, totalHold };
  }, [transformedMap]);

  return (
    <>
      <Header />
      <main className="container">
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">{t('pages.yard.title')}</h1>
            <p className="page-subtitle">{t('pages.yard.welcome')}</p>
          </div>
        </div>

        <div className="yard-layout">
          {/* Left Column - Yard Map */}
          <div className="yard-left">
            <Card title={t('pages.yard.yardMap')}>
              {/* Toolbar: thống kê nhanh + hành động */}
              <div className="yard-toolbar">
                <div className="yard-stats">
                  <span className="badge" title="Số block">Block: {stats.totalBlocks}</span>
                  <span className="badge" title="Tổng slot">Slots: {stats.totalSlots}</span>
                  <span className="badge badge-occ" title="Tổng container trong bãi">O:{stats.totalOcc}</span>
                  <span className="badge badge-hold" title="Tổng HOLD trong bãi">H:{stats.totalHold}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => mutate('yard_map')}>🔄 {t('common.refresh')}</button>
                  {selectedSlotId && (
                    <button className="btn btn-secondary" onClick={() => { setSelectedSlotId(''); }}>{t('common.cancel')}</button>
                  )}
                </div>
              </div>

              {/* Locate Container */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                <input
                  placeholder="Nhập số container để định vị (VD: ABCU1234567)"
                  value={searchContainer}
                  onChange={(e) => setSearchContainer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') {
                    (async () => {
                      const v = searchContainer.trim();
                      if (!v || v.length < 4) { setLocateError('Vui lòng nhập số container hợp lệ (>= 4 ký tự)'); return; }
                      try {
                        setLocateError(''); setLocating(true);
                        const res = await yardApi.locate(v);
                        const slotId = res?.slot_id || res?.slot?.id;
                        const slotCode = res?.slot_code || res?.slot?.code || '';
                        if (!slotId) { setLocateError('Không tìm thấy vị trí container'); return; }
                        setSelectedSlotId(String(slotId));
                        setActiveSlot({ id: String(slotId), code: String(slotCode) });
                      } catch (err: any) {
                        setLocateError(err?.response?.data?.message || err?.message || 'Không tìm thấy vị trí container');
                      } finally { setLocating(false); }
                    })();
                  }}}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  disabled={locating}
                  onClick={async () => {
                    const v = searchContainer.trim();
                    if (!v || v.length < 4) { setLocateError('Vui lòng nhập số container hợp lệ (>= 4 ký tự)'); return; }
                    try {
                      setLocateError(''); setLocating(true);
                      const res = await yardApi.locate(v);
                      const slotId = res?.slot_id || res?.slot?.id;
                      const slotCode = res?.slot_code || res?.slot?.code || '';
                      if (!slotId) { setLocateError('Không tìm thấy vị trí container'); return; }
                      setSelectedSlotId(String(slotId));
                      setActiveSlot({ id: String(slotId), code: String(slotCode) });
                    } catch (err: any) {
                      setLocateError(err?.response?.data?.message || err?.message || 'Không tìm thấy vị trí container');
                    } finally { setLocating(false); }
                  }}
                >
                  🔎 Locate
                </button>
              </div>
              {locateError && (
                <div className="message-banner error" style={{ marginBottom: 12 }}>
                  <p>{locateError}</p>
                  <button className="close-btn" onClick={() => setLocateError('')}>×</button>
                </div>
              )}
              {isLoading && (
                <div className="skeleton" aria-busy="true" aria-live="polite">
                  <div className="skeleton-line lg"></div>
                  <div className="skeleton-line md"></div>
                  <div className="skeleton-line md"></div>
                  <div className="skeleton-line lg"></div>
                </div>
              )}
              {!isLoading && (
                isEmpty ? (
                  <div className="empty-state" style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Chưa có dữ liệu bãi</div>
                    <div className="muted">Hãy tạo Yard/Block/Slot để hiển thị sơ đồ bãi.</div>
                  </div>
                ) : (
                  <YardMap
                    yard={transformedMap[0]}
                    onSlotClick={(slot) => { setSelectedSlotId(slot.id); setActiveSlot({ id: slot.id, code: slot.code }); }}
                    suggestedSlots={[]}
                    selectedSlotId={selectedSlotId}
                  />
                )
              )}
            </Card>
          </div>
        </div>
        {/* Modal chi tiết Stack */}
        {activeSlot && (
          <StackDetailsModal
            visible={!!activeSlot}
            slotId={activeSlot.id}
            slotCode={activeSlot.code}
            onCancel={() => setActiveSlot(null)}
            onActionDone={() => mutate('yard_map')}
          />
        )}
      </main>
    </>
  );
}


