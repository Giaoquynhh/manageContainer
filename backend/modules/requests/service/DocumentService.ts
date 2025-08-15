import fs from 'fs';
import path from 'path';
import { ensureAllowedMime, DOC_LIMITS } from '../../../shared/utils/mime';
import { prisma } from '../../../shared/config/database';
import { DocumentRepository } from '../repository/DocumentRepository';

export const DocumentService = {
  async uploadCustomerDoc(params: {
    requestId: string;
    file: Express.Multer.File;
    actorId: string;
  }) {
    // Kiểm tra request tồn tại
    const req = await prisma.serviceRequest.findUnique({ 
      where: { id: params.requestId } 
    });
    if (!req) throw new Error('REQUEST_NOT_FOUND');

    // Kiểm tra trạng thái request
    const blocked = ['REJECTED', 'LEFT_YARD', 'EXPORTED'];
    if (blocked.includes(req.status)) {
      throw new Error('REQUEST_CLOSED');
    }

    // Kiểm tra MIME type
    ensureAllowedMime(params.file.mimetype);

    // Kiểm tra số lượng file
    const currentCount = await DocumentRepository.countByRequest(params.requestId);
    if (currentCount >= DOC_LIMITS.MAX_FILES_PER_REQUEST) {
      throw new Error('MAX_FILES_EXCEEDED');
    }

    // Tạo document record
    const doc = await DocumentRepository.create({
      requestId: params.requestId,
      type: 'DOCUMENT',
      originalName: params.file.originalname,
      storedName: params.file.filename,
      mimeType: params.file.mimetype,
      sizeBytes: params.file.size,
      storageKey: `uploads/requests/${params.file.filename}`,
      uploaderId: params.actorId,
    });

    // Cập nhật counter
    await DocumentRepository.updateRequestDocumentCount(params.requestId, 1);

    return doc;
  },

  async list(requestId: string) {
    return DocumentRepository.listByRequest(requestId);
  },

  async findById(id: string) {
    const doc = await DocumentRepository.findById(id);
    if (!doc || doc.deletedAt) {
      throw new Error('DOC_NOT_FOUND');
    }
    return doc;
  },

  async remove(docId: string, actorId: string, reason?: string) {
    const doc = await DocumentRepository.findById(docId);
    if (!doc || doc.deletedAt) {
      throw new Error('DOC_NOT_FOUND');
    }

    // Kiểm tra quyền xóa (chỉ uploader hoặc admin)
    if (doc.uploaderId !== actorId) {
      // TODO: Kiểm tra role admin
      throw new Error('PERMISSION_DENIED');
    }

    await DocumentRepository.softDelete(docId, actorId, reason);
    await DocumentRepository.updateRequestDocumentCount(doc.request_id, -1);

    return { success: true };
  },

  async getFilePath(docId: string): Promise<string> {
    const doc = await DocumentRepository.findById(docId);
    if (!doc || doc.deletedAt) {
      throw new Error('DOC_NOT_FOUND');
    }

    // Sử dụng path.join để tạo đường dẫn chính xác
    const filePath = path.join(process.cwd(), doc.storageKey);
    console.log('File path:', filePath); // Debug log
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found at:', filePath); // Debug log
      throw new Error('FILE_NOT_FOUND');
    }

    return filePath;
  },
};
