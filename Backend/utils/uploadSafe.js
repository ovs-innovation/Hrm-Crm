import path from 'path';

/** Map trusted MIME → extension (never trust originalname). */
export const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'audio/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

export function safeUploadFilename(prefix, mimetype) {
  const ext = MIME_TO_EXT[mimetype] || '.bin';
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

export function extFromOriginal(name) {
  return path.extname(name || '').toLowerCase();
}
