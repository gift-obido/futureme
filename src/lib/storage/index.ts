import { get, set, del, clear } from 'idb-keyval';
import type { PhotoRef } from '../domain/types';

// Photos live in IndexedDB (outside the ~5MB localStorage quota). The store
// only ever holds PhotoRef keys — never the blobs themselves.

const KEY_PREFIX = 'photo:';

/** Thrown when a photo can't be persisted (e.g. storage quota exceeded). */
export class PhotoStorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PhotoStorageError';
  }
}

const newKey = (): string =>
  `${KEY_PREFIX}${
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }`;

const isQuotaError = (e: unknown): boolean =>
  e instanceof DOMException &&
  (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');

/**
 * Persist a photo blob to IndexedDB and return a serialisable ref for the store.
 * @throws PhotoStorageError on quota exhaustion or write failure.
 */
export async function savePhoto(file: Blob): Promise<PhotoRef> {
  const key = newKey();
  try {
    await set(key, file);
  } catch (e) {
    throw new PhotoStorageError(
      isQuotaError(e)
        ? 'Not enough device storage to save this photo.'
        : 'Could not save this photo.',
      e,
    );
  }
  return { key, capturedAt: new Date().toISOString() };
}

/**
 * Resolve a PhotoRef to a displayable object URL, or null if missing/unreadable.
 * Callers must revoke the URL with `revokePhotoUrl` when done to avoid leaks.
 */
export async function getPhotoUrl(ref: PhotoRef | undefined | null): Promise<string | null> {
  if (!ref?.key) return null;
  try {
    const blob = await get<Blob>(ref.key);
    return blob ? URL.createObjectURL(blob) : null;
  } catch (e) {
    console.warn('[storage] getPhotoUrl failed', e);
    return null;
  }
}

/** Delete a stored photo. Never throws — a failed delete is logged, not fatal. */
export async function deletePhoto(ref: PhotoRef | undefined | null): Promise<void> {
  if (!ref?.key) return;
  try {
    await del(ref.key);
  } catch (e) {
    console.warn('[storage] deletePhoto failed', e);
  }
}

/** Release an object URL previously returned by getPhotoUrl. */
export function revokePhotoUrl(url: string | null | undefined): void {
  if (url) URL.revokeObjectURL(url);
}

/** Wipe every stored photo (used by "Reset app"). Never throws. */
export async function clearAllPhotos(): Promise<void> {
  try {
    await clear();
  } catch (e) {
    console.warn('[storage] clearAllPhotos failed', e);
  }
}

/** Convenience namespace mirroring the named exports. */
export const photoStorage = {
  savePhoto,
  getPhotoUrl,
  deletePhoto,
  revokePhotoUrl,
};
