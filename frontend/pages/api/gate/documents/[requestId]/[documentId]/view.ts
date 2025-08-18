import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    const { requestId, documentId } = req.query;
    
    if (!requestId || !documentId) {
      return res.status(400).json({ message: 'Missing requestId or documentId' });
    }

    // Debug logging
    console.log('🔍 API Debug:', {
      requestId,
      documentId,
      hasToken: !!req.query.token,
      hasCookieToken: !!req.cookies.token,
      hasHeaderToken: !!req.headers.authorization
    });

    // Lấy token từ query parameter hoặc header
    const token = req.query.token as string || req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    // Debug token
    console.log('🔐 Token Debug:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...'
    });

    // Gọi API backend để lấy file
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:1000';
    const backendEndpoint = `${backendUrl}/gate/requests/${requestId}/documents/${documentId}/view`;
    
    console.log('🚀 Backend Call:', {
      backendUrl,
      backendEndpoint,
      tokenLength: token.length
    });
    
    const response = await fetch(backendEndpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Backend Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend Error:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        return res.status(response.status).json(errorData);
      } catch {
        return res.status(response.status).json({ 
          message: `Backend error: ${response.status} ${response.statusText}`,
          details: errorText
        });
      }
    }

    // Lấy content type và file buffer
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition');
    const fileBuffer = await response.arrayBuffer();

    console.log('✅ File loaded successfully:', {
      contentType,
      contentDisposition,
      fileSize: fileBuffer.byteLength
    });

    // Set headers cho response
    res.setHeader('Content-Type', contentType);
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Gửi file buffer
    res.send(Buffer.from(fileBuffer));

  } catch (error: any) {
    console.error('❌ Error viewing document:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      stack: error.stack
    });
  }
}
