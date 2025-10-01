import React, { useState, useEffect, useRef } from 'react';
import { containersApi } from '../services/containers';

export interface ContainerSearchResult {
  container_no: string;
  slot_code: string;
  block_code: string;
  yard_name: string;
  tier?: number;
  placed_at: string;
  // Thêm thông tin từ Container model
  customer?: {
    id: string;
    name: string;
    code: string;
  };
  shipping_line?: {
    id: string;
    name: string;
    code: string;
  };
  container_type?: {
    id: string;
    code: string;
    description: string;
  };
  seal_number?: string;
  dem_det?: string;
}

interface ContainerSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  error?: boolean;
  onSelect?: (container: ContainerSearchResult | null) => void;
}

export const ContainerSearchInput: React.FC<ContainerSearchInputProps> = ({
  value,
  onChange,
  placeholder = "Nhập số container",
  style,
  error = false,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ContainerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchContainers(searchQuery);
      } else {
        setSearchResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchContainers = async (query: string) => {
    if (query.length < 2) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/backend/yard/search-containers?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.containers || []);
        setIsOpen(true);
      } else {
        console.error('Search failed:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    if (onSelect) {
      onSelect(null);
    }
  };

  const handleSelectContainer = async (container: ContainerSearchResult) => {
    setSearchQuery(container.container_no);
    onChange(container.container_no);
    setIsOpen(false);
    
    // Lấy thông tin chi tiết từ Container model
    try {
      const response = await containersApi.get(container.container_no);
      if (response.success && response.data) {
        const containerInfo = {
          ...container,
          customer: response.data.customer,
          shipping_line: response.data.shipping_line,
          container_type: response.data.container_type,
          seal_number: response.data.seal_number,
          dem_det: response.data.dem_det
        };
        
        if (onSelect) {
          onSelect(containerInfo);
        }
      } else {
        if (onSelect) {
          onSelect(container);
        }
      }
    } catch (error) {
      console.error('Error fetching container details:', error);
      if (onSelect) {
        onSelect(container);
      }
    }
  };


  const inputStyle: React.CSSProperties = {
    padding: '12px 16px',
    border: error ? '2px solid #ef4444' : '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    background: 'white',
    transition: 'all 0.2s ease',
    outline: 'none',
    width: '100%',
    ...style
  };

  const inputFocusStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: error ? '#ef4444' : '#3b82f6',
    boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => {
          if (searchResults.length > 0) {
            setIsOpen(true);
          }
        }}
        placeholder={placeholder}
        style={isOpen ? inputFocusStyle : inputStyle}
        autoComplete="off"
      />
      
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '2px solid #e2e8f0',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {isLoading ? (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px'
            }}>
              Đang tìm kiếm...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((container, index) => (
              <div
                key={`${container.container_no}-${index}`}
                onClick={() => handleSelectContainer(container)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1e293b'
                  }}>
                    {container.container_no}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: '#64748b',
                    backgroundColor: '#f1f5f9',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '500'
                  }}>
                    Trong bãi
                  </span>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>{container.block_code}-{container.slot_code}</span>
                  {container.tier && (
                    <span style={{
                      backgroundColor: '#e2e8f0',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      Tầng {container.tier}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : searchQuery.length >= 2 ? (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              Không tìm thấy container nào
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
