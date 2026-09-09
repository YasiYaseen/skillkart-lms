const rawApiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const API_BASE_URL = rawApiBase.replace(/\/+$/, '');

export const DEFAULT_FALLBACK_THUMBNAIL =
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop';

/**
 * Resolves any relative media or upload URL to a fully qualified URL.
 * Passes through external links (http/https/data/blob) unchanged.
 */
export function resolveMediaUrl(url?: string | null, fallback?: string): string {
  if (!url || typeof url !== 'string') {
    return fallback || '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return fallback || '';
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_BASE_URL}${cleanPath}`;
}
