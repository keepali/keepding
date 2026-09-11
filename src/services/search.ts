import { Bookmark, BookmarkFilter } from '../db/schema';

export interface ParsedQuery {
  terms: string[];
  tags: string[];
  unreadOnly: boolean;
  archivedOnly: boolean;
  notesOnly: boolean;
  imagesOnly: boolean;
  site?: string;
}

export function parseSearchQuery(queryStr: string): ParsedQuery {
  const terms: string[] = [];
  const tags: string[] = [];
  let unreadOnly = false;
  let archivedOnly = false;
  let notesOnly = false;
  let imagesOnly = false;
  let site: string | undefined = undefined;

  const rawTokens = queryStr.trim().split(/\s+/).filter(Boolean);

  for (const token of rawTokens) {
    if (token.startsWith('#')) {
      const tag = token.slice(1).toLowerCase().trim();
      if (tag) tags.push(tag);
    } else if (token.toLowerCase() === '!unread') {
      unreadOnly = true;
    } else if (token.toLowerCase() === '!archived') {
      archivedOnly = true;
    } else if (token.toLowerCase() === '!note' || token.toLowerCase() === '!notes') {
      notesOnly = true;
    } else if (token.toLowerCase() === '!image' || token.toLowerCase() === '!images') {
      imagesOnly = true;
    } else if (token.toLowerCase().startsWith('site:')) {
      site = token.slice(5).toLowerCase().trim();
    } else {
      terms.push(token.toLowerCase());
    }
  }

  return { terms, tags, unreadOnly, archivedOnly, notesOnly, imagesOnly, site };
}

export function filterBookmarks(
  bookmarks: Bookmark[],
  queryStr: string,
  activeFilter: BookmarkFilter = 'all',
  selectedTags: string[] = [],
  sortOrder: 'date_desc' | 'date_asc' | 'title_asc' = 'date_desc'
): Bookmark[] {
  const parsed = parseSearchQuery(queryStr);
  const allTagsToMatch = Array.from(new Set([...parsed.tags, ...selectedTags.map(t => t.toLowerCase())]));

  let filtered = bookmarks.filter(bm => {
    // 1. Filter checks
    if (parsed.unreadOnly || activeFilter === 'unread') {
      if (!bm.unread || bm.archived) return false;
    } else if (parsed.archivedOnly || activeFilter === 'archived') {
      if (!bm.archived) return false;
    } else if (parsed.notesOnly || activeFilter === 'notes') {
      if (bm.archived || !bm.notes || bm.notes.trim().length === 0) return false;
    } else if (parsed.imagesOnly || activeFilter === 'images') {
      const hasImages = (bm.images && bm.images.length > 0) || (bm.notes && bm.notes.includes('!['));
      if (bm.archived || !hasImages) return false;
    } else {
      // 'all' view
      if (bm.archived && !parsed.archivedOnly) return false;
    }

    // 2. Tag filter
    if (allTagsToMatch.length > 0) {
      const bmTags = bm.tags.map(t => t.toLowerCase());
      const hasAllTags = allTagsToMatch.every(reqTag => bmTags.includes(reqTag));
      if (!hasAllTags) return false;
    }

    // 3. Site filter
    if (parsed.site && bm.url) {
      try {
        const host = new URL(bm.url).hostname.toLowerCase();
        if (!host.includes(parsed.site)) return false;
      } catch {
        if (!bm.url.toLowerCase().includes(parsed.site)) return false;
      }
    }

    // 4. Text match
    if (parsed.terms.length > 0) {
      const textToSearch = [
        bm.title,
        bm.description,
        bm.notes,
        bm.url,
        ...bm.tags
      ].join(' ').toLowerCase();

      const matchesAllTerms = parsed.terms.every(term => textToSearch.includes(term));
      if (!matchesAllTerms) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    // Pinned always on top
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    if (sortOrder === 'date_asc') {
      return a.createdAt - b.createdAt;
    }
    if (sortOrder === 'title_asc') {
      return (a.title || a.url).localeCompare(b.title || b.url);
    }
    return b.createdAt - a.createdAt;
  });
}
