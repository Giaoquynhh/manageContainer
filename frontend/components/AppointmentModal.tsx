import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface AppointmentModalProps {
    requestId: string;
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface AppointmentData {
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

export default function AppointmentModal({ requestId, visible, onClose, onSuccess }: AppointmentModalProps) {
    const [formData, setFormData] = useState<AppointmentData>({
        appointment_time: '',
        location_type: 'gate',
        location_id: '',
        gate_ref: '',
        note: ''
    });
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load danh sách locations
    useEffect(() => {
        if (visible) {
            loadLocations();
        }
    }, [visible]);

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

    const handleInputChange = (field: keyof AppointmentData, value: string) => {
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
        } else {
            const selectedTime = new Date(formData.appointment_time);
            const now = new Date();
            if (selectedTime <= now) {
                newErrors.appointment_time = 'Thời gian lịch hẹn phải trong tương lai';
            }
        }

        if (!formData.location_id) {
            newErrors.location_id = 'Địa điểm là bắt buộc';
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
            // Convert datetime-local to ISO8601 format
            const appointmentData = {
                ...formData,
                appointment_time: new Date(formData.appointment_time).toISOString()
            };
            console.log('Sending appointment data:', appointmentData);
            await api.post(`/requests/${requestId}/accept`, appointmentData);
            
            // Reset form
            setFormData({
                appointment_time: '',
                location_type: 'gate',
                location_id: '',
                gate_ref: '',
                note: ''
            });
            setErrors({});
            
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error accepting request:', error);
            
            // Handle specific errors
            if (error.response?.status === 422) {
                setErrors({ appointment_time: 'Khung giờ này không khả dụng, vui lòng chọn thời gian khác' });
            } else if (error.response?.data?.message) {
                setErrors({ general: error.response.data.message });
            } else {
                setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại' });
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredLocations = locations.filter(loc => loc.type === formData.location_type);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Tạo lịch hẹn</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Thời gian lịch hẹn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Thời gian lịch hẹn *
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.appointment_time}
                            onChange={(e) => handleInputChange('appointment_time', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md ${
                                errors.appointment_time ? 'border-red-500' : 'border-gray-300'
                            }`}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                        {errors.appointment_time && (
                            <p className="text-red-500 text-sm mt-1">{errors.appointment_time}</p>
                        )}
                    </div>

                    {/* Loại địa điểm */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loại địa điểm *
                        </label>
                        <select
                            value={formData.location_type}
                            onChange={(e) => {
                                handleInputChange('location_type', e.target.value as 'gate' | 'yard');
                                handleInputChange('location_id', ''); // Reset location_id when type changes
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="gate">Cổng</option>
                            <option value="yard">Bãi</option>
                        </select>
                    </div>

                    {/* Địa điểm cụ thể */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa điểm *
                        </label>
                        <select
                            value={formData.location_id}
                            onChange={(e) => handleInputChange('location_id', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md ${
                                errors.location_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Chọn địa điểm</option>
                            {filteredLocations.map(location => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                        {errors.location_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.location_id}</p>
                        )}
                    </div>

                    {/* GATE REF */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            GATE REF (tùy chọn)
                        </label>
                        <input
                            type="text"
                            value={formData.gate_ref}
                            onChange={(e) => handleInputChange('gate_ref', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Nhập GATE REF nếu có"
                            maxLength={100}
                        />
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú (tùy chọn)
                        </label>
                        <textarea
                            value={formData.note}
                            onChange={(e) => handleInputChange('note', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Ghi chú về lịch hẹn"
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    {/* Error message */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-red-600 text-sm">{errors.general}</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Gửi lịch hẹn'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
