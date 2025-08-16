import React, { useState, useRef } from 'react';
import axios from 'axios';

/**
 * Example component demonstrating document upload and viewer functionality
 */
export default function DocumentUploadExample() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Example documents for demo
  const exampleDocuments = [
    {
      id: 'doc-1',
      file_name: 'invoice.pdf',
      storage_key: '1703123456789-invoice.pdf',
      file_type: 'application/pdf',
      file_size: 1024000
    },
    {
      id: 'doc-2',
      file_name: 'container_photo.jpg',
      storage_key: '1703123456790-container_photo.jpg',
      file_type: 'image/jpeg',
      file_size: 512000
    },
    {
      id: 'doc-3',
      file_name: 'bill_of_lading.pdf',
      storage_key: '1703123456791-bill_of_lading.pdf',
      file_type: 'application/pdf',
      file_size: 2048000
    }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
      });

      // Simulate API call
      console.log('Uploading files:', files.map(f => f.name));
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add uploaded files to documents list
      const newDocuments = files.map((file, index) => ({
        id: `uploaded-${Date.now()}-${index}`,
        file_name: file.name,
        storage_key: `${Date.now()}-${file.name}`,
        file_type: file.type,
        file_size: file.size
      }));
      
      setUploadedDocuments(prev => [...prev, ...newDocuments]);
      setFiles([]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      alert('Files uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const isPDF = (mimeType: string) => {
    return mimeType === 'application/pdf';
  };

  const getFileIcon = (mimeType: string) => {
    if (isImage(mimeType)) return '🖼️';
    if (isPDF(mimeType)) return '📄';
    return '📎';
  };

  const allDocuments = [...exampleDocuments, ...uploadedDocuments];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Document Upload & Viewer Example</h1>
      
      {/* File Upload Section */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">File Upload</h2>
        
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.pdf"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JPG, PNG, GIF, PDF (Max 10MB per file)
          </p>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Selected Files:</h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center">
                    <span className="mr-2">{getFileIcon(file.type)}</span>
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
      </div>

      {/* Document Viewer Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Document Viewer</h2>
        
        {allDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No documents available
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocument(doc)}
                className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="text-center">
                  {isImage(doc.file_type) ? (
                    <div className="w-full h-24 bg-gray-100 flex items-center justify-center rounded mb-2">
                      <span className="text-2xl">🖼️</span>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-gray-100 flex items-center justify-center rounded mb-2">
                      <span className="text-2xl">📄</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-600 truncate mb-1">{doc.file_name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedDocument.file_name}</h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Type: {selectedDocument.file_type}</span>
                <span>Size: {formatFileSize(selectedDocument.file_size)}</span>
              </div>
            </div>
            
            {isImage(selectedDocument.file_type) ? (
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-8 mb-4">
                  <span className="text-6xl">🖼️</span>
                  <p className="text-gray-500 mt-2">Image Preview</p>
                </div>
                <p className="text-sm text-gray-600">
                  In real implementation, this would show the actual image
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-8 mb-4">
                  <span className="text-6xl">📄</span>
                  <p className="text-gray-500 mt-2">PDF Document</p>
                </div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  📥 Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Implementation Notes */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Implementation Notes</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>File Upload:</strong> Sử dụng FormData và multipart/form-data</li>
            <li><strong>File Validation:</strong> Kiểm tra type và size trước khi upload</li>
            <li><strong>Storage:</strong> Files được lưu tại server với unique filename</li>
            <li><strong>Database:</strong> Metadata được lưu trong document_files table</li>
            <li><strong>Viewer:</strong> Modal popup với preview cho images và download cho PDFs</li>
            <li><strong>Security:</strong> Public access cho viewing, authentication cho uploading</li>
          </ul>
        </div>
      </div>

      {/* API Examples */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">API Examples</h2>
        
        <div className="grid gap-4">
          {/* Upload Files */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Upload Files</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div>POST /api/requests</div>
              <div>Content-Type: multipart/form-data</div>
              <div>Body: FormData with 'documents' field</div>
            </div>
          </div>

          {/* Get Documents */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Get Documents</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div>GET /api/requests/{'{request_id}'}/documents</div>
            </div>
          </div>

          {/* View Document */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">View Document</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              <div>GET /api/requests/documents/{'{storage_key}'}</div>
              <div>Public access - no authentication required</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example of DocumentViewer component
 */
export function DocumentViewerExample() {
  const [documents, setDocuments] = useState(exampleDocuments);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [showViewer, setShowViewer] = useState(false);

  const exampleDocuments = [
    {
      id: 'doc-1',
      file_name: 'invoice.pdf',
      storage_key: '1703123456789-invoice.pdf',
      file_type: 'application/pdf',
      file_size: 1024000
    },
    {
      id: 'doc-2',
      file_name: 'container_photo.jpg',
      storage_key: '1703123456790-container_photo.jpg',
      file_type: 'image/jpeg',
      file_size: 512000
    }
  ];

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">DocumentViewer Component Example</h2>
      
      <button
        onClick={() => setShowViewer(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        Open Document Viewer
      </button>

      {showViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chứng từ</h2>
              <button
                onClick={() => setShowViewer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Document List */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <div className="text-center">
                    {isImage(doc.file_type) ? (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center rounded mb-2">
                        <span className="text-2xl">🖼️</span>
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center rounded mb-2">
                        <span className="text-2xl">📄</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 truncate">{doc.file_name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Preview Modal */}
            {selectedDoc && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
                <div className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{selectedDoc.file_name}</h3>
                    <button
                      onClick={() => setSelectedDoc(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {isImage(selectedDoc.file_type) ? (
                    <div className="text-center">
                      <div className="bg-gray-100 rounded-lg p-8 mb-4">
                        <span className="text-6xl">🖼️</span>
                        <p className="text-gray-500 mt-2">Image Preview</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        In real implementation, this would show the actual image
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="bg-gray-100 rounded-lg p-8 mb-4">
                        <span className="text-6xl">📄</span>
                        <p className="text-gray-500 mt-2">PDF Document</p>
                      </div>
                      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        📥 Download PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


