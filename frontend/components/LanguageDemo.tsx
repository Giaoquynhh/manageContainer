import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export default function LanguageDemo() {
  const { t, currentLanguage, changeLanguage } = useTranslation();

  return (
    <div className="language-demo" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🌍 Demo Hệ Thống Đa Ngôn Ngữ</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Ngôn ngữ hiện tại:</strong> {currentLanguage === 'vi' ? 'Tiếng Việt' : 'English'}</p>
        <p><strong>Current Language:</strong> {currentLanguage === 'vi' ? 'Vietnamese' : 'English'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => changeLanguage('vi')}
          style={{ 
            marginRight: '10px', 
            padding: '8px 16px', 
            backgroundColor: currentLanguage === 'vi' ? '#007bff' : '#f8f9fa',
            color: currentLanguage === 'vi' ? 'white' : '#333',
            border: '1px solid #007bff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🇻🇳 Tiếng Việt
        </button>
        <button 
          onClick={() => changeLanguage('en')}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: currentLanguage === 'en' ? '#007bff' : '#f8f9fa',
            color: currentLanguage === 'en' ? 'white' : '#333',
            border: '1px solid #007bff',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🇬🇧 English
        </button>
      </div>

      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h3>📝 Các Ví Dụ Translation:</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <strong>Header:</strong>
          <ul>
            <li>Brand: {t('header.brand')}</li>
            <li>Account: {t('header.account')}</li>
            <li>Login: {t('header.login')}</li>
          </ul>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>Sidebar:</strong>
          <ul>
            <li>Users/Partners: {t('sidebar.usersPartners')}</li>
            <li>Permissions: {t('sidebar.permissions')}</li>
            <li>Requests: {t('sidebar.requests')}</li>
            <li>Gate: {t('sidebar.gate')}</li>
            <li>Yard: {t('sidebar.yard')}</li>
          </ul>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>Pages:</strong>
          <ul>
            <li>Requests Title: {t('pages.requests.depotTitle')}</li>
            <li>Gate Title: {t('pages.gate.title')}</li>
            <li>Yard Title: {t('pages.yard.title')}</li>
          </ul>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>Common:</strong>
          <ul>
            <li>Loading: {t('common.loading')}</li>
            <li>Save: {t('common.save')}</li>
            <li>Cancel: {t('common.cancel')}</li>
            <li>Search: {t('common.search')}</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
        <h4>💡 Hướng Dẫn Sử Dụng:</h4>
        <ol>
          <li>Click vào nút ngôn ngữ để chuyển đổi</li>
          <li>Quan sát tất cả text thay đổi theo ngôn ngữ</li>
          <li>Ngôn ngữ được lưu vào localStorage</li>
          <li>Refresh trang để kiểm tra ngôn ngữ được lưu</li>
        </ol>
      </div>
    </div>
  );
}

