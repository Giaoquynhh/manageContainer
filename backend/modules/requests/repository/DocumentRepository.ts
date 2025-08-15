import { prisma } from '../../../shared/config/database';

export const DocumentRepository = {
  async create(meta: {
    requestId: string;
    type: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    uploaderId: string;
  }) {
    return prisma.documentFile.create({ 
      data: {
        request_id: meta.requestId,
        type: meta.type,
        originalName: meta.originalName,
        storedName: meta.storedName,
        mimeType: meta.mimeType,
        sizeBytes: meta.sizeBytes,
        storageKey: meta.storageKey,
        uploaderId: meta.uploaderId,
      }
    });
  },

  async listByRequest(requestId: string) {
    return prisma.documentFile.findMany({
      where: { 
        request_id: requestId, 
        deletedAt: null 
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.documentFile.findUnique({ 
      where: { id },
      include: { request: true }
    });
  },

  async softDelete(id: string, actorId: string, reason?: string) {
    return prisma.documentFile.update({
      where: { id },
      data: { 
        deletedAt: new Date(), 
        deletedBy: actorId, 
        deleteReason: reason 
      },
    });
  },

  async countByRequest(requestId: string) {
    return prisma.documentFile.count({
      where: { 
        request_id: requestId, 
        deletedAt: null 
      }
    });
  },

  async updateRequestDocumentCount(requestId: string, increment: number) {
    return prisma.serviceRequest.update({
      where: { id: requestId },
      data: { documentsCount: { increment } },
    });
  },
};
