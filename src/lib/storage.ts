// Small, failure-tolerant wrapper around localStorage.
// Private windows / blocked storage just fall back to in-memory defaults.

const PREFIX = 'studyspot:';

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full — ignore */
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Hash a password for the local demo account store.
 * NOTE: this is a client-only demo. It is NOT real authentication security.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}:${password}`;
  if (window.crypto?.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for insecure contexts (non-https, non-localhost)
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return `weak_${(h >>> 0).toString(16)}`;
}

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
