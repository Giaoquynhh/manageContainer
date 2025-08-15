import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import fs from 'fs';
import { DocumentService } from '../service/DocumentService';
import { UploadDocumentBody, DeleteDocumentBody } from '../dto/DocumentDtos';

export const DocumentController = {
  async uploadDocument(req: AuthRequest, res: Response) {
    try {
      const { error, value } = UploadDocumentBody.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          message: 'Validation error', 
          details: error.details 
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const doc = await DocumentService.uploadCustomerDoc({
        requestId: value.request_id,
        file: req.file,
        actorId: req.user!._id,
      });

      res.status(201).json({
        message: 'Document uploaded successfully',
        data: doc,
      });
    } catch (error: any) {
      console.error('Upload document error:', error);
      
      if (error.message === 'REQUEST_NOT_FOUND') {
        return res.status(404).json({ message: 'Request not found' });
      }
      if (error.message === 'REQUEST_CLOSED') {
        return res.status(400).json({ message: 'Request is closed, cannot upload documents' });
      }
      if (error.message === 'UNSUPPORTED_FILE_TYPE') {
        return res.status(400).json({ message: 'Unsupported file type' });
      }
      if (error.message === 'MAX_FILES_EXCEEDED') {
        return res.status(400).json({ message: 'Maximum number of files exceeded' });
      }

      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async listDocuments(req: AuthRequest, res: Response) {
    try {
      const { requestId } = req.params;
      const docs = await DocumentService.list(requestId);
      
      res.json({
        message: 'Documents retrieved successfully',
        data: docs,
      });
    } catch (error: any) {
      console.error('List documents error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async viewDocument(req: AuthRequest, res: Response) {
    try {
      const { docId } = req.params;
      const doc = await DocumentService.findById(docId);
      const filePath = await DocumentService.getFilePath(docId);

      // Thêm CORS headers cho việc load ảnh
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.type(doc.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error: any) {
      console.error('View document error:', error);
      
      if (error.message === 'DOC_NOT_FOUND') {
        return res.status(404).json({ message: 'Document not found' });
      }
      if (error.message === 'FILE_NOT_FOUND') {
        return res.status(404).json({ message: 'File not found on disk' });
      }

      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async downloadDocument(req: AuthRequest, res: Response) {
    try {
      const { docId } = req.params;
      const doc = await DocumentService.findById(docId);
      const filePath = await DocumentService.getFilePath(docId);

      res.type(doc.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName}"`);
      
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (error: any) {
      console.error('Download document error:', error);
      
      if (error.message === 'DOC_NOT_FOUND') {
        return res.status(404).json({ message: 'Document not found' });
      }
      if (error.message === 'FILE_NOT_FOUND') {
        return res.status(404).json({ message: 'File not found on disk' });
      }

      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async deleteDocument(req: AuthRequest, res: Response) {
    try {
      const { docId } = req.params;
      const { error, value } = DeleteDocumentBody.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          message: 'Validation error', 
          details: error.details 
        });
      }

      const result = await DocumentService.remove(docId, req.user!._id, value.reason);
      
      res.json({
        message: 'Document deleted successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Delete document error:', error);
      
      if (error.message === 'DOC_NOT_FOUND') {
        return res.status(404).json({ message: 'Document not found' });
      }
      if (error.message === 'PERMISSION_DENIED') {
        return res.status(403).json({ message: 'Permission denied' });
      }

      res.status(500).json({ message: 'Internal server error' });
    }
  },
};
