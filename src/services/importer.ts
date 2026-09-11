
import { generateId, normalizeUrl } from '../db';

export interface ParsedImportItem {
  id?: string;
  url: string;
  title: string;
  description: string;
  notes: string;
  tags: string[];
  unread: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export function parseJSONImport(jsonText: string): ParsedImportItem[] {
  const data = JSON.parse(jsonText);
  let rawList: any[] = [];

  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && Array.isArray(data.bookmarks)) {
    rawList = data.bookmarks;
  } else if (data && Array.isArray(data.results)) {
    // Linkding REST API export format
    rawList = data.results;
  } else {
    throw new Error('无法识别的 JSON 结构，请确保是导出的书签数据');
  }

  const result: ParsedImportItem[] = [];

  for (const item of rawList) {
    if (!item.url) continue;

    // Support both `tags` (array of strings) and `tag_names` (linkding style)
    let tags: string[] = [];
    if (Array.isArray(item.tags)) {
      tags = item.tags.map((t: any) => (typeof t === 'string' ? t : t.name || ''));
    } else if (Array.isArray(item.tag_names)) {
      tags = item.tag_names.map(String);
    } else if (typeof item.tags === 'string') {
      tags = item.tags.split(',').map((s: string) => s.trim());
    }

    let createdAt = Date.now();
    if (item.createdAt) {
      createdAt = typeof item.createdAt === 'number' ? item.createdAt : new Date(item.createdAt).getTime();
    } else if (item.date_added) {
      createdAt = new Date(item.date_added).getTime();
    }

    result.push({
      id: item.id || generateId(),
      url: normalizeUrl(item.url),
      title: (item.title || item.url).trim(),
      description: (item.description || item.website_description || '').trim(),
      notes: (item.notes || '').trim(),
      tags: tags.filter(Boolean),
      unread: !!(item.unread ?? false),
      archived: !!(item.archived ?? false),
      createdAt: isNaN(createdAt) ? Date.now() : createdAt,
      updatedAt: Date.now(),
    });
  }

  return result;
}

export function parseHTMLBookmarks(htmlText: string): ParsedImportItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const links = doc.querySelectorAll('a');
  const result: ParsedImportItem[] = [];

  links.forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('place:')) {
      return;
    }

    const title = a.textContent?.trim() || href;
    const addDateAttr = a.getAttribute('add_date');
    let createdAt = Date.now();
    if (addDateAttr) {
      const sec = parseInt(addDateAttr, 10);
      if (!isNaN(sec) && sec > 0) {
        // Netscape format timestamp is in seconds
        createdAt = sec * 1000;
      }
    }

    const tags: string[] = [];
    // 1. Tags attribute
    const tagsAttr = a.getAttribute('tags');
    if (tagsAttr) {
      tagsAttr.split(',').forEach(t => {
        const clean = t.trim();
        if (clean) tags.push(clean);
      });
    }

    // 2. Extract folder hierarchy as tags if available
    let parent = a.parentElement;
    while (parent && parent !== doc.body) {
      if (parent.tagName.toUpperCase() === 'DL') {
        // Check if there is an H3 preceding this DL
        const prevH3 = parent.previousElementSibling;
        if (prevH3 && prevH3.tagName.toUpperCase() === 'H3') {
          const folderName = prevH3.textContent?.trim();
          if (folderName && !['Bookmarks bar', '书签栏', 'Other bookmarks', '其他书签'].includes(folderName)) {
            tags.push(folderName);
          }
        }
      }
      parent = parent.parentElement;
    }

    // 3. Extract description / notes from next sibling <DD>
    let description = '';
    let notes = '';
    let sibling = a.parentElement?.nextElementSibling;
    if (sibling && sibling.tagName.toUpperCase() === 'DD') {
      const ddText = sibling.textContent?.trim() || '';
      if (ddText.includes('[Notes]:')) {
        const parts = ddText.split('[Notes]:');
        description = parts[0].trim();
        notes = parts[1].trim();
      } else {
        description = ddText;
      }
    }

    result.push({
      id: generateId(),
      url: normalizeUrl(href),
      title: title,
      description: description,
      notes: notes,
      tags: Array.from(new Set(tags)),
      unread: false,
      archived: false,
      createdAt: createdAt,
      updatedAt: Date.now(),
    });
  });

  return result;
}
