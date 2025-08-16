import React, { useState } from 'react';
import SimpleChatBox from '../components/SimpleChatBox';

/**
 * Example component demonstrating how to use SimpleChatBox
 */
export default function ChatBoxExample() {
  const [showChat, setShowChat] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState({
    id: 'example-request-123',
    status: 'PENDING',
    type: 'IMPORT',
    container_no: 'ABCD1234567',
    rejected_reason: null
  });

  // Example requests with different statuses
  const exampleRequests = [
    {
      id: 'req-1',
      status: 'PENDING',
      type: 'IMPORT',
      container_no: 'ABCD1234567',
      rejected_reason: null
    },
    {
      id: 'req-2',
      status: 'APPROVED',
      type: 'EXPORT',
      container_no: 'EFGH7890123',
      rejected_reason: null
    },
    {
      id: 'req-3',
      status: 'REJECTED',
      type: 'IMPORT',
      container_no: 'IJKL4567890',
      rejected_reason: 'Thiếu chứng từ vận đơn'
    },
    {
      id: 'req-4',
      status: 'COMPLETED',
      type: 'EXPORT',
      container_no: 'MNOP1234567',
      rejected_reason: null
    }
  ];

  const openChat = (request: any) => {
    setSelectedRequest(request);
    setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Đã chấp nhận', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Từ chối', className: 'bg-red-100 text-red-800' },
      COMPLETED: { label: 'Hoàn thành', className: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ChatBox Component Examples</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Example Requests</h2>
        <div className="grid gap-4">
          {exampleRequests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Request #{request.id}</h3>
                  <p className="text-sm text-gray-600">
                    {request.type} - Container {request.container_no}
                  </p>
                  {request.rejected_reason && (
                    <p className="text-sm text-red-600 mt-1">
                      Lý do từ chối: {request.rejected_reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(request.status)}
                  <button
                    onClick={() => openChat(request)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    💬 Open Chat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Usage Instructions</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">How to use SimpleChatBox:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Import SimpleChatBox component</li>
            <li>Pass required props: requestId, requestStatus, onClose</li>
            <li>Optional props: rejectedReason, requestType, containerNo</li>
            <li>Component will automatically handle chat restrictions based on status</li>
            <li>System messages will be displayed for status changes</li>
          </ol>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Status Behavior</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">✅ Chat Allowed</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• APPROVED</li>
              <li>• IN_PROGRESS</li>
              <li>• COMPLETED</li>
              <li>• EXPORTED</li>
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">❌ Chat Disabled</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• PENDING</li>
              <li>• REJECTED</li>
              <li>• CANCELLED</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <SimpleChatBox
          requestId={selectedRequest.id}
          requestStatus={selectedRequest.status}
          rejectedReason={selectedRequest.rejected_reason}
          requestType={selectedRequest.type}
          containerNo={selectedRequest.container_no}
          onClose={closeChat}
        />
      )}
    </div>
  );
}

/**
 * Example of how to integrate ChatBox in a table
 */
export function ChatBoxTableExample() {
  const [showChat, setShowChat] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const requests = [
    {
      id: 'req-1',
      type: 'IMPORT',
      container_no: 'ABCD1234567',
      status: 'PENDING',
      rejected_reason: null
    },
    {
      id: 'req-2',
      type: 'EXPORT',
      container_no: 'EFGH7890123',
      status: 'APPROVED',
      rejected_reason: null
    }
  ];

  const openChat = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
    setSelectedRequestId(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Table Integration Example</h2>
      
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Request ID</th>
            <th className="border border-gray-300 p-2">Type</th>
            <th className="border border-gray-300 p-2">Container</th>
            <th className="border border-gray-300 p-2">Status</th>
            <th className="border border-gray-300 p-2">Chat</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td className="border border-gray-300 p-2">{request.id}</td>
              <td className="border border-gray-300 p-2">{request.type}</td>
              <td className="border border-gray-300 p-2">{request.container_no}</td>
              <td className="border border-gray-300 p-2">{request.status}</td>
              <td className="border border-gray-300 p-2">
                <button
                  onClick={() => openChat(request.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  💬 Chat
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Chat Modal */}
      {showChat && selectedRequestId && (
        <SimpleChatBox
          requestId={selectedRequestId}
          requestStatus={requests.find(r => r.id === selectedRequestId)?.status}
          rejectedReason={requests.find(r => r.id === selectedRequestId)?.rejected_reason}
          requestType={requests.find(r => r.id === selectedRequestId)?.type}
          containerNo={requests.find(r => r.id === selectedRequestId)?.container_no}
          onClose={closeChat}
        />
      )}
    </div>
  );
}


