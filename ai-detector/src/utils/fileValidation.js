export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt', 'rtf', 'ppt', 'pptx'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const nameParts = file.name.split('.');
  const extension = nameParts.length > 1 ? nameParts.pop().toLowerCase() : '';

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file format (.${extension || 'unknown'}). Supported formats: ${ALLOWED_EXTENSIONS.map(e => e.toUpperCase()).join(', ')}.`
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10 MB limit (${formatFileSize(file.size)}). Please choose a smaller file.`
    };
  }

  return {
    valid: true,
    fileInfo: {
      name: file.name,
      extension: extension.toUpperCase(),
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      lastModified: file.lastModified ? new Date(file.lastModified).toISOString() : new Date().toISOString()
    }
  };
}

