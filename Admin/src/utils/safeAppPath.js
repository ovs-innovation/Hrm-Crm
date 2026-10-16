/** Only in-app relative paths. Blocks protocol-relative and external URLs. */
export function safeAppPath(link) {
  if (typeof link !== 'string') return null;
  const path = link.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://') || path.includes('\\')) {
    return null;
  }
  return path;
}
