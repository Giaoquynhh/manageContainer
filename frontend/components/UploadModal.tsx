import React, { useState, useRef } from 'react';
import { api } from '@services/api';

interface UploadModalProps {
    requestId: string;
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FileInfo {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

export default function UploadModal({ requestId, visible, onClose, onSuccess }: UploadModalProps) {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        
        // Validate files
        const validFiles = selectedFiles.filter(file => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            
            if (file.size > maxSize) {
                alert(`File ${file.name} vượt quá 10MB`);
                return false;
            }
            
            const hasValidMimeType = allowedMimeTypes.includes(file.type);
            const hasValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
            
            if (!hasValidMimeType && !hasValidExtension) {
                alert(`File ${file.name} không được hỗ trợ. Chỉ chấp nhận PDF, JPG, JPEG, PNG`);
                return false;
            }
            
            return true;
        });

        // Add files to list
        const newFiles: FileInfo[] = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            progress: 0,
            status: 'pending'
        }));

        setFiles(prev => [...prev, ...newFiles]);
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const uploadFile = async (fileInfo: FileInfo): Promise<boolean> => {
        try {
            // Update status to uploading
            setFiles(prev => prev.map(f => 
                f.id === fileInfo.id ? { ...f, status: 'uploading', progress: 0 } : f
            ));

            // Simulate file upload with progress
            for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                setFiles(prev => prev.map(f => 
                    f.id === fileInfo.id ? { ...f, progress: i } : f
                ));
            }

            // Prepare file data for API
            const fileData = {
                file_name: fileInfo.file.name,
                file_type: fileInfo.file.name.split('.').pop()?.toLowerCase() || 'pdf',
                file_size: fileInfo.file.size,
                storage_url: `https://example.com/uploads/${fileInfo.file.name}` // Demo URL
            };

            // Call API to create attachment record
            await api.post(`/requests/${requestId}/attachments`, fileData);

            // Update status to success
            setFiles(prev => prev.map(f => 
                f.id === fileInfo.id ? { ...f, status: 'success', progress: 100 } : f
            ));

            return true;
        } catch (error) {
            console.error('Error uploading file:', error);
            
            // Update status to error
            setFiles(prev => prev.map(f => 
                f.id === fileInfo.id ? { 
                    ...f, 
                    status: 'error', 
                    error: 'Upload thất bại' 
                } : f
            ));
            
            return false;
        }
    };

    const handleUploadAll = async () => {
        if (files.length === 0) return;

        setUploading(true);
        
        try {
            // Upload files sequentially
            for (const fileInfo of files) {
                if (fileInfo.status === 'pending') {
                    await uploadFile(fileInfo);
                }
            }
            
            // Check if all files uploaded successfully
            const allSuccess = files.every(f => f.status === 'success');
            if (allSuccess) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Error uploading files:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        
        // Validate and add dropped files
        const validFiles = droppedFiles.filter(file => {
            const maxSize = 10 * 1024 * 1024;
            const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            
            const hasValidMimeType = allowedMimeTypes.includes(file.type);
            const hasValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
            
            return file.size <= maxSize && (hasValidMimeType || hasValidExtension);
        });

        const newFiles: FileInfo[] = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            progress: 0,
            status: 'pending'
        }));

        setFiles(prev => [...prev, ...newFiles]);
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Gửi thông tin chi tiết</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                        disabled={uploading}
                    >
                        ✕
                    </button>
                </div>

                {/* File upload area */}
                <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="text-gray-500">
                        <p className="text-lg mb-2">Kéo thả file vào đây hoặc</p>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            disabled={uploading}
                        >
                            Chọn file
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <p className="text-sm mt-2">
                            Hỗ trợ: PDF, JPG, JPEG, PNG (tối đa 10MB/file)
                        </p>
                    </div>
                </div>

                {/* File list */}
                {files.length > 0 && (
                    <div className="mb-4">
                        <h3 className="font-medium mb-2">Danh sách file ({files.length})</h3>
                        <div className="space-y-2">
                            {files.map(fileInfo => (
                                <div key={fileInfo.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{fileInfo.file.name}</span>
                                            <span className="text-xs text-gray-500">
                                                ({(fileInfo.file.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                        </div>
                                        
                                        {/* Progress bar */}
                                        {fileInfo.status === 'uploading' && (
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${fileInfo.progress}%` }}
                                                ></div>
                                            </div>
                                        )}
                                        
                                        {/* Status */}
                                        <div className="flex items-center gap-2 mt-1">
                                            {fileInfo.status === 'pending' && (
                                                <span className="text-yellow-600 text-xs">⏳ Chờ upload</span>
                                            )}
                                            {fileInfo.status === 'uploading' && (
                                                <span className="text-blue-600 text-xs">📤 Đang upload...</span>
                                            )}
                                            {fileInfo.status === 'success' && (
                                                <span className="text-green-600 text-xs">✅ Hoàn thành</span>
                                            )}
                                            {fileInfo.status === 'error' && (
                                                <span className="text-red-600 text-xs">❌ {fileInfo.error}</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Remove button */}
                                    {fileInfo.status === 'pending' && (
                                        <button
                                            onClick={() => removeFile(fileInfo.id)}
                                            className="text-red-500 hover:text-red-700 ml-2"
                                            disabled={uploading}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        disabled={uploading}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleUploadAll}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        disabled={uploading || files.length === 0}
                    >
                        {uploading ? 'Đang upload...' : 'Upload tất cả'}
                    </button>
                </div>
            </div>
        </div>
    );
}




