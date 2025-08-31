import React from 'react';
import Header from '@components/Header';
import { useTranslation } from '../hooks/useTranslation';

export default function LanguageTest() {
  const { t, currentLanguage, changeLanguage } = useTranslation();

  return (
    <>
      <Header />
      <main className="container">
        <div className="page-header">
          <h1 className="page-title">🌍 Test Hệ Thống Đa Ngôn Ngữ</h1>
          <p className="page-subtitle">Kiểm tra tất cả các translation keys</p>
        </div>

        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          {/* Language Switcher */}
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <h3>Ngôn ngữ hiện tại: {currentLanguage === 'vi' ? 'Tiếng Việt' : 'English'}</h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
              <button 
                onClick={() => changeLanguage('vi')}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: currentLanguage === 'vi' ? '#007bff' : '#f8f9fa',
                  color: currentLanguage === 'vi' ? 'white' : '#333',
                  border: '1px solid #007bff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🇻🇳 Tiếng Việt
              </button>
              <button 
                onClick={() => changeLanguage('en')}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: currentLanguage === 'en' ? '#007bff' : '#f8f9fa',
                  color: currentLanguage === 'en' ? 'white' : '#333',
                  border: '1px solid #007bff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Translation Examples */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Header Section */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              <h3>📝 Header</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><strong>Brand:</strong> {t('header.brand')}</li>
                <li><strong>Account:</strong> {t('header.account')}</li>
                <li><strong>Login:</strong> {t('header.login')}</li>
                <li><strong>Logout:</strong> {t('header.logout')}</li>
              </ul>
            </div>

            {/* Sidebar Section */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              <h3>📱 Sidebar</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><strong>Users:</strong> {t('sidebar.usersPartners')}</li>
                <li><strong>Permissions:</strong> {t('sidebar.permissions')}</li>
                <li><strong>Requests:</strong> {t('sidebar.requests')}</li>
                <li><strong>Gate:</strong> {t('sidebar.gate')}</li>
                <li><strong>Yard:</strong> {t('sidebar.yard')}</li>
              </ul>
            </div>

            {/* Pages Section */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              <h3>📄 Pages</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><strong>Gate Title:</strong> {t('pages.gate.title')}</li>
                <li><strong>Gate Subtitle:</strong> {t('pages.gate.subtitle')}</li>
                <li><strong>Yard Title:</strong> {t('pages.yard.title')}</li>
                <li><strong>Requests Title:</strong> {t('pages.requests.depotTitle')}</li>
              </ul>
            </div>

            {/* Common Section */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              <h3>🔧 Common</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><strong>Loading:</strong> {t('common.loading')}</li>
                <li><strong>Save:</strong> {t('common.save')}</li>
                <li><strong>Cancel:</strong> {t('common.cancel')}</li>
                <li><strong>Search:</strong> {t('common.search')}</li>
                <li><strong>Refresh:</strong> {t('common.refresh')}</li>
              </ul>
            </div>

            {/* Gate Specific Section */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              <h3>🚪 Gate</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><strong>Search Button:</strong> {t('pages.gate.searchButton')}</li>
                <li><strong>Clear Filters:</strong> {t('pages.gate.clearFilters')}</li>
                <li><strong>Status Label:</strong> {t('pages.gate.statusLabel')}</li>
                <li><strong>Type Label:</strong> {t('pages.gate.typeLabel')}</li>
                <li><strong>No Data:</strong> {t('pages.gate.noData')}</li>
              </ul>
            </div>

            {/* Table Headers Section */}
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              <h3>📊 Table Headers</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li><strong>Container:</strong> {t('pages.gate.tableHeaders.container')}</li>
                <li><strong>Type:</strong> {t('pages.gate.tableHeaders.type')}</li>
                <li><strong>Status:</strong> {t('pages.gate.tableHeaders.status')}</li>
                <li><strong>Actions:</strong> {t('pages.gate.tableHeaders.actions')}</li>
              </ul>
            </div>

          </div>

          {/* Instructions */}
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e7f3ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
            <h4>💡 Hướng Dẫn Test:</h4>
            <ol>
              <li>Click vào nút ngôn ngữ để chuyển đổi</li>
              <li>Quan sát tất cả text thay đổi theo ngôn ngữ</li>
              <li>Kiểm tra các trang khác (Gate, Yard, Requests) để xem translation</li>
              <li>Refresh trang để kiểm tra ngôn ngữ được lưu</li>
              <li>Kiểm tra localStorage để xem ngôn ngữ được lưu</li>
            </ol>
          </div>

          {/* Current Language Info */}
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #87ceeb' }}>
            <h4>🔍 Thông Tin Ngôn Ngữ:</h4>
            <p><strong>Current Language:</strong> {currentLanguage}</p>
            <p><strong>Document Lang:</strong> {typeof document !== 'undefined' ? document.documentElement.getAttribute('lang') : 'N/A'}</p>
            <p><strong>LocalStorage:</strong> {typeof window !== 'undefined' ? localStorage.getItem('preferred-language') : 'N/A'}</p>
          </div>
        </div>
      </main>
    </>
  );
}
