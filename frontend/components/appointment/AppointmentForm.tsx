import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface AppointmentFormData {
  appointment_time: string;
  location_type: 'gate' | 'yard';
  location_id: string;
  gate_ref?: string;
  note?: string;
}

interface Location {
  id: string;
  name: string;
  type: 'gate' | 'yard';
}

interface AppointmentFormProps {
  requestId: string;
  requestData?: {
    id: string;
    container_no: string;
    type: string;
    status: string;
    created_by: string;
  };
  onSubmit: (data: AppointmentFormData) => void;
  onError: (error: string) => void;
  onSuccess: () => void;
}

export default function AppointmentForm({
  requestId,
  requestData,
  onSubmit,
  onError,
  onSuccess
}: AppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    appointment_time: '',
    location_type: 'gate',
    location_id: '',
    gate_ref: '',
    note: ''
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load locations
  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      // Demo data - trong thực tế sẽ gọi API
      const demoLocations: Location[] = [
        { id: 'gate-1', name: 'Cổng chính', type: 'gate' },
        { id: 'gate-2', name: 'Cổng phụ', type: 'gate' },
        { id: 'yard-a', name: 'Bãi A', type: 'yard' },
        { id: 'yard-b', name: 'Bãi B', type: 'yard' }
      ];
      setLocations(demoLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleInputChange = (field: keyof AppointmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.appointment_time) {
      newErrors.appointment_time = 'Thời gian lịch hẹn là bắt buộc';
    }

    if (!formData.location_id) {
      newErrors.location_id = 'Vui lòng chọn địa điểm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Convert datetime-local to ISO8601 format and map fields to match backend DTO
      const appointmentData = {
        appointment_time: new Date(formData.appointment_time).toISOString(),
        appointment_location_type: formData.location_type,
        appointment_location_id: formData.location_id,
        gate_ref: formData.gate_ref,
        appointment_note: formData.note
      };
      
      console.log('Submitting appointment data:', appointmentData);
      await api.patch(`/requests/${requestId}/schedule`, appointmentData);
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      
      // Handle specific errors
      if (error.response?.status === 422) {
        onError('Khung giờ này không khả dụng, vui lòng chọn thời gian khác');
      } else if (error.response?.data?.message) {
        onError(error.response.data.message);
      } else {
        onError('Có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(loc => loc.type === formData.location_type);

  // Get minimum datetime (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  console.log('AppointmentForm rendering with:', { requestId, requestData, formData });

  return (
    <form className="appointment-form" onSubmit={handleSubmit}>
      <div className="appointment-form-content">
        {/* Request Info */}
        <div className="appointment-request-info">
          <div className="appointment-info-item">
            <span className="appointment-info-label">Container:</span>
            <span className="appointment-info-value">{requestData?.container_no || requestId}</span>
          </div>
          <div className="appointment-info-item">
            <span className="appointment-info-label">Loại:</span>
            <span className="appointment-info-value">{requestData?.type || 'N/A'}</span>
          </div>
        </div>

        {/* Appointment Date */}
        <div className="appointment-form-group">
          <label className="appointment-form-label" htmlFor="appointment_date">
            Ngày lịch hẹn *
          </label>
          <input
            type="date"
            id="appointment_date"
            className={`appointment-form-input ${errors.appointment_time ? 'error' : ''}`}
            value={formData.appointment_time ? formData.appointment_time.split('T')[0] : ''}
            onChange={(e) => {
              const time = formData.appointment_time ? formData.appointment_time.split('T')[1] || '09:00' : '09:00';
              handleInputChange('appointment_time', `${e.target.value}T${time}`);
            }}
            min={new Date().toISOString().split('T')[0]}
            disabled={loading}
          />
        </div>

        {/* Appointment Time */}
        <div className="appointment-form-group">
          <label className="appointment-form-label" htmlFor="appointment_time">
            Giờ lịch hẹn *
          </label>
          <input
            type="time"
            id="appointment_time"
            className={`appointment-form-input ${errors.appointment_time ? 'error' : ''}`}
            value={formData.appointment_time ? formData.appointment_time.split('T')[1] || '09:00' : '09:00'}
            onChange={(e) => {
              const date = formData.appointment_time ? formData.appointment_time.split('T')[0] : new Date().toISOString().split('T')[0];
              handleInputChange('appointment_time', `${date}T${e.target.value}`);
            }}
            disabled={loading}
          />
          {errors.appointment_time && (
            <span className="appointment-form-error">{errors.appointment_time}</span>
          )}
        </div>

        {/* Location Type */}
        <div className="appointment-form-group">
          <label className="appointment-form-label">Loại địa điểm *</label>
          <div className="appointment-radio-group">
            <label className="appointment-radio-item">
              <input
                type="radio"
                name="location_type"
                value="gate"
                checked={formData.location_type === 'gate'}
                onChange={(e) => handleInputChange('location_type', e.target.value)}
                disabled={loading}
              />
              <span className="appointment-radio-text">Cổng (Gate)</span>
            </label>
            <label className="appointment-radio-item">
              <input
                type="radio"
                name="location_type"
                value="yard"
                checked={formData.location_type === 'yard'}
                onChange={(e) => handleInputChange('location_type', e.target.value)}
                disabled={loading}
              />
              <span className="appointment-radio-text">Bãi (Yard)</span>
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="appointment-form-group">
          <label className="appointment-form-label" htmlFor="location_id">
            Địa điểm *
          </label>
          <select
            id="location_id"
            className={`appointment-form-select ${errors.location_id ? 'error' : ''}`}
            value={formData.location_id}
            onChange={(e) => handleInputChange('location_id', e.target.value)}
            disabled={loading}
          >
            <option value="">Chọn địa điểm</option>
            {filteredLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          {errors.location_id && (
            <span className="appointment-form-error">{errors.location_id}</span>
          )}
        </div>

        {/* Gate Ref */}
        <div className="appointment-form-group">
          <label className="appointment-form-label" htmlFor="gate_ref">
            GATE REF (tùy chọn)
          </label>
          <input
            type="text"
            id="gate_ref"
            className="appointment-form-input"
            value={formData.gate_ref}
            onChange={(e) => handleInputChange('gate_ref', e.target.value)}
            placeholder="Nhập GATE REF nếu có"
            maxLength={100}
            disabled={loading}
          />
        </div>



        {/* Note */}
        <div className="appointment-form-group">
          <label className="appointment-form-label" htmlFor="note">
            Ghi chú (tùy chọn)
          </label>
          <textarea
            id="note"
            className="appointment-form-textarea"
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            placeholder="Nhập ghi chú cho lịch hẹn..."
            maxLength={500}
            rows={3}
            disabled={loading}
          />
          <div className="appointment-form-counter">
            {formData.note?.length || 0}/500
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="appointment-form-actions">
        <button
          type="submit"
          className="appointment-form-submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="appointment-loading-spinner"></div>
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
              </svg>
              <span>Tạo lịch hẹn</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
