import { api } from './api';

export interface Document {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  type: string;
}

export const documentService = {
  // Upload document
  async uploadDocument(file: File, requestId: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('request_id', requestId);
    formData.append('type', 'DOCUMENT');

    const response = await api.post('/requests/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  },

  // Get documents for a request
  async getDocuments(requestId: string): Promise<Document[]> {
    const response = await api.get(`/requests/${requestId}/documents`);
    return response.data.data;
  },

  // Get document view URL
  getDocumentViewUrl(requestId: string, documentId: string): string {
    return `/api/requests/${requestId}/documents/${documentId}/view`;
  },

  // Get document download URL
  getDocumentDownloadUrl(requestId: string, documentId: string): string {
    return `/api/requests/${requestId}/documents/${documentId}/download`;
  },

  // Download document
  async downloadDocument(requestId: string, documentId: string): Promise<Blob> {
    const response = await api.get(
      `/requests/${requestId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Delete document
  async deleteDocument(documentId: string, reason?: string): Promise<void> {
    await api.delete(`/requests/documents/${documentId}`, {
      data: { reason }
    });
  },

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file icon based on MIME type
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    return '📎';
  },

  // Validate file
  validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Chỉ hỗ trợ file JPG, PNG, PDF' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File không được lớn hơn 10MB' };
    }

    return { valid: true };
  },
};

