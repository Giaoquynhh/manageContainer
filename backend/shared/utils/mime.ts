export const DOC_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_REQUEST: 10,
  ALLOWED_MIME: [
    'image/jpeg', 
    'image/png', 
    'application/pdf'
  ],
};

export function ensureAllowedMime(mime: string): void {
  const ok = DOC_LIMITS.ALLOWED_MIME.includes(mime);
  if (!ok) {
    throw new Error('UNSUPPORTED_FILE_TYPE');
  }
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}
