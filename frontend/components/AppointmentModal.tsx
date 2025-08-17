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
            await api.patch(`/requests/${requestId}/schedule`, appointmentData);
            
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

    console.log('AppointmentModal rendered with date/time pickers');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[60vh] flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Tạo lịch hẹn</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl"
                            disabled={loading}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: '400px' }}>

                <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
                    {/* Ngày lịch hẹn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày lịch hẹn *
                        </label>
                        <input
                            type="date"
                            value={formData.appointment_time ? formData.appointment_time.split('T')[0] : ''}
                            onChange={(e) => {
                                const time = formData.appointment_time ? formData.appointment_time.split('T')[1] || '09:00' : '09:00';
                                handleInputChange('appointment_time', `${e.target.value}T${time}`);
                            }}
                            className={`w-full px-3 py-2 border rounded-md ${
                                errors.appointment_time ? 'border-red-500' : 'border-gray-300'
                            }`}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Giờ lịch hẹn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Giờ lịch hẹn *
                        </label>
                        <input
                            type="time"
                            value={formData.appointment_time ? formData.appointment_time.split('T')[1] || '09:00' : '09:00'}
                            onChange={(e) => {
                                const date = formData.appointment_time ? formData.appointment_time.split('T')[0] : new Date().toISOString().split('T')[0];
                                handleInputChange('appointment_time', `${date}T${e.target.value}`);
                            }}
                            className={`w-full px-3 py-2 border rounded-md ${
                                errors.appointment_time ? 'border-red-500' : 'border-gray-300'
                            }`}
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
                        <div className="text-xs text-gray-500 mt-1">
                            {formData.note.length}/500 ký tự
                        </div>
                    </div>

                    {/* Thông tin bổ sung */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loại container
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Chọn loại container</option>
                            <option value="20ft">20ft Standard</option>
                            <option value="40ft">40ft Standard</option>
                            <option value="40hc">40ft High Cube</option>
                            <option value="45ft">45ft High Cube</option>
                        </select>
                    </div>

                    {/* Trọng lượng */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trọng lượng (kg)
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Nhập trọng lượng container"
                            min="0"
                            max="30000"
                        />
                    </div>

                    {/* Số lượng */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số lượng container
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Nhập số lượng"
                            min="1"
                            max="10"
                        />
                    </div>

                    {/* Yêu cầu đặc biệt */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Yêu cầu đặc biệt
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input type="checkbox" className="mr-2" />
                                <span className="text-sm">Cần xe nâng</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" className="mr-2" />
                                <span className="text-sm">Cần kiểm tra hải quan</span>
                            </label>
                            <label className="flex items-center">
                                <input type="checkbox" className="mr-2" />
                                <span className="text-sm">Cần bảo hiểm</span>
                            </label>
                        </div>
                    </div>

                    {/* Thông tin liên hệ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Người liên hệ
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Tên người liên hệ"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Số điện thoại liên hệ"
                        />
                    </div>

                    {/* Thông tin bổ sung */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả hàng hóa
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Mô tả chi tiết hàng hóa trong container"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú đặc biệt
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Ghi chú đặc biệt cho việc xử lý"
                            rows={2}
                        />
                    </div>

                    {/* Thông tin vận chuyển */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phương thức vận chuyển
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <option value="">Chọn phương thức</option>
                            <option value="truck">Xe tải</option>
                            <option value="train">Tàu hỏa</option>
                            <option value="ship">Tàu biển</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Điểm đến
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Địa chỉ điểm đến"
                        />
                    </div>

                    {/* Thông tin bổ sung */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả chi tiết
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Mô tả chi tiết về yêu cầu"
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Yêu cầu đặc biệt khác
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Các yêu cầu đặc biệt khác"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ghi chú nội bộ
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Ghi chú nội bộ cho nhân viên"
                            rows={2}
                        />
                    </div>

                    {/* Error message */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-red-600 text-sm">{errors.general}</p>
                        </div>
                    )}

                </form>
                </div>

                <div className="p-6 border-t border-gray-200">
                    <div className="flex gap-3">
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
                            form="appointment-form"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Tạo lịch hẹn'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
