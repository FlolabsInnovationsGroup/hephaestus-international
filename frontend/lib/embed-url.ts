/**
 * Normalize external URLs for <iframe src="..."> where possible.
 * Many sites block embedding (X-Frame-Options); callers should also offer "Open in new tab".
 */
export function toEmbedUrl(url: string): string {
  const normalized = url.trim();
  if (!normalized) return '';

  try {
    if (normalized.includes('youtube.com/watch')) {
      const parsed = new URL(normalized);
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : normalized;
    }
    if (normalized.includes('youtu.be/')) {
      const id = normalized.split('youtu.be/')[1]?.split('?')[0];
      return id ? `https://www.youtube.com/embed/${id}` : normalized;
    }

    const driveMatch = normalized.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    if (normalized.includes('canva.com/design/')) {
      const u = new URL(normalized);
      const parts = u.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last === 'edit') parts[parts.length - 1] = 'view';
      else if (last !== 'view') parts.push('view');
      u.pathname = `/${parts.join('/')}`;
      u.search = 'embed';
      return u.toString();
    }
  } catch {
    return normalized;
  }

  return normalized;
}
