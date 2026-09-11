import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Bookmark, TagStats } from './schema';

interface PinscribeDB extends DBSchema {
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: {
      'by-url': string;
      'by-createdAt': number;
    };
  };
}

const DB_NAME = 'pinscribe_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PinscribeDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<PinscribeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PinscribeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('bookmarks')) {
          const store = db.createObjectStore('bookmarks', { keyPath: 'id' });
          store.createIndex('by-url', 'url');
          store.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export function generateId(): string {
  return 'bm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    // remove hash if wanted, but keep query params
    return parsed.href;
  } catch {
    return url.trim();
  }
}

export async function getBookmarkById(id: string): Promise<Bookmark | undefined> {
  const db = await getDB();
  return db.get('bookmarks', id);
}

export async function getBookmarkByUrl(url: string): Promise<Bookmark | undefined> {
  const db = await getDB();
  const normalized = normalizeUrl(url);
  // Search index first
  const match = await db.getFromIndex('bookmarks', 'by-url', normalized);
  if (match) return match;

  // Fallback: match without trailing slash
  const alt = normalized.endsWith('/') ? normalized.slice(0, -1) : normalized + '/';
  return db.getFromIndex('bookmarks', 'by-url', alt);
}

export async function saveBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number; updatedAt?: number }): Promise<Bookmark> {
  const db = await getDB();
  const now = Date.now();
  
  // Clean tags: trim, remove empty, deduplicate
  const cleanTags = Array.from(new Set(
    (bookmark.tags || [])
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0)
  ));

  const finalBookmark: Bookmark = {
    id: bookmark.id || generateId(),
    url: normalizeUrl(bookmark.url),
    title: (bookmark.title || '').trim() || normalizeUrl(bookmark.url),
    description: (bookmark.description || '').trim(),
    notes: bookmark.notes || '',
    tags: cleanTags,
    unread: !!bookmark.unread,
    archived: !!bookmark.archived,
    createdAt: bookmark.createdAt || now,
    updatedAt: now,
  };

  await db.put('bookmarks', finalBookmark);
  return finalBookmark;
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bookmarks', id);
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = await getDB();
  const all = await db.getAll('bookmarks');
  // default sort by createdAt desc
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getTagStats(): Promise<TagStats[]> {
  const bookmarks = await getAllBookmarks();
  const counts = new Map<string, number>();

  for (const bm of bookmarks) {
    if (bm.archived) continue; // count active bookmark tags
    for (const tag of bm.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  const result: TagStats[] = [];
  counts.forEach((count, name) => {
    result.push({ name, count });
  });

  return result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function toggleUnread(id: string): Promise<Bookmark | undefined> {
  const db = await getDB();
  const bm = await db.get('bookmarks', id);
  if (!bm) return undefined;
  bm.unread = !bm.unread;
  bm.updatedAt = Date.now();
  await db.put('bookmarks', bm);
  return bm;
}

export async function toggleArchived(id: string): Promise<Bookmark | undefined> {
  const db = await getDB();
  const bm = await db.get('bookmarks', id);
  if (!bm) return undefined;
  bm.archived = !bm.archived;
  bm.updatedAt = Date.now();
  await db.put('bookmarks', bm);
  return bm;
}

export interface BulkImportResult {
  added: number;
  updated: number;
  skipped: number;
}

export async function bulkImportBookmarks(
  items: Array<Partial<Bookmark> & { url: string; title?: string }>,
  overwriteDuplicates: boolean = false
): Promise<BulkImportResult> {
  const db = await getDB();
  let added = 0;
  let updated = 0;
  let skipped = 0;

  const tx = db.transaction('bookmarks', 'readwrite');
  const store = tx.objectStore('bookmarks');
  const urlIndex = store.index('by-url');

  for (const item of items) {
    if (!item.url) {
      skipped++;
      continue;
    }

    const normUrl = normalizeUrl(item.url);
    const existing = await urlIndex.get(normUrl);

    if (existing) {
      if (overwriteDuplicates) {
        const mergedTags = Array.from(new Set([
          ...existing.tags,
          ...(item.tags || []).map(t => t.trim().toLowerCase()).filter(Boolean)
        ]));

        const updatedBm: Bookmark = {
          ...existing,
          title: item.title?.trim() || existing.title,
          description: item.description?.trim() ?? existing.description,
          notes: item.notes ?? existing.notes,
          tags: mergedTags,
          unread: item.unread !== undefined ? item.unread : existing.unread,
          archived: item.archived !== undefined ? item.archived : existing.archived,
          updatedAt: Date.now()
        };
        await store.put(updatedBm);
        updated++;
      } else {
        skipped++;
      }
    } else {
      const cleanTags = Array.from(new Set(
        (item.tags || [])
          .map(t => t.trim().toLowerCase())
          .filter(Boolean)
      ));
      const newBm: Bookmark = {
        id: item.id || generateId(),
        url: normUrl,
        title: (item.title || normUrl).trim(),
        description: (item.description || '').trim(),
        notes: item.notes || '',
        tags: cleanTags,
        unread: !!item.unread,
        archived: !!item.archived,
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now()
      };
      await store.put(newBm);
      added++;
    }
  }

  await tx.done;
  return { added, updated, skipped };
}
