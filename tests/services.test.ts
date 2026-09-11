import assert from 'node:assert';
import { describe, it } from 'node:test';
import { parseSearchQuery, filterBookmarks } from '../src/services/search';
import { exportToJSON, exportToNetscapeHTML } from '../src/services/exporter';
import { parseJSONImport } from '../src/services/importer';
import { Bookmark } from '../src/db/schema';

describe('Search & Query Parser', () => {
  it('should parse complex search queries with tags, unread, and site', () => {
    const q = parseSearchQuery('github #dev !unread site:github.com tutorial !notes !images');
    assert.deepStrictEqual(q.tags, ['dev']);
    assert.strictEqual(q.unreadOnly, true);
    assert.strictEqual(q.notesOnly, true);
    assert.strictEqual(q.imagesOnly, true);
    assert.strictEqual(q.site, 'github.com');
    assert.deepStrictEqual(q.terms, ['github', 'tutorial']);
  });

  it('should filter bookmarks by text, tags, notes, and images', () => {
    const testList: Bookmark[] = [
      {
        id: '1',
        url: 'https://github.com/vladkens/offline',
        title: 'Offline Project',
        description: 'Great offline tool',
        notes: '# Notes\nThis is a note with markdown',
        images: ['https://example.com/cover.png'],
        tags: ['dev', 'offline'],
        pinned: true,
        unread: true,
        archived: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: '2',
        url: 'https://news.ycombinator.com',
        title: 'Hacker News',
        description: 'Tech news',
        notes: '',
        tags: ['news'],
        unread: false,
        archived: false,
        createdAt: 2000,
        updatedAt: 2000,
      },
      {
        id: '3',
        url: 'https://archive.org',
        title: 'Internet Archive',
        description: 'History',
        notes: '',
        tags: ['archive'],
        unread: false,
        archived: true,
        createdAt: 3000,
        updatedAt: 3000,
      }
    ];

    // Filter by tag
    const byTag = filterBookmarks(testList, '#dev');
    assert.strictEqual(byTag.length, 1);
    assert.strictEqual(byTag[0].id, '1');

    // Filter by unread
    const unread = filterBookmarks(testList, '', 'unread');
    assert.strictEqual(unread.length, 1);
    assert.strictEqual(unread[0].id, '1');

    // Filter by notes
    const withNotes = filterBookmarks(testList, '', 'notes');
    assert.strictEqual(withNotes.length, 1);
    assert.strictEqual(withNotes[0].id, '1');

    // Filter by images
    const withImages = filterBookmarks(testList, '', 'images');
    assert.strictEqual(withImages.length, 1);
    assert.strictEqual(withImages[0].id, '1');

    // Pinned sorting
    const sorted = filterBookmarks(testList, '');
    assert.strictEqual(sorted[0].id, '1'); // pinned item is first
  });
});

describe('Export & Import Formats', () => {
  const sampleBookmarks: Bookmark[] = [
    {
      id: 'bm1',
      url: 'https://example.com/doc',
      title: 'Example Documentation',
      description: 'Useful docs',
      notes: '- [x] Read chapter 1\n- [ ] Try code sample',
      images: ['https://example.com/photo.jpg'],
      tags: ['docs', 'tutorial'],
      pinned: true,
      unread: true,
      archived: false,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    }
  ];

  it('should export and parse JSON backup losslessly', () => {
    const jsonStr = exportToJSON(sampleBookmarks);
    const parsed = parseJSONImport(jsonStr);

    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].url, sampleBookmarks[0].url);
    assert.strictEqual(parsed[0].title, sampleBookmarks[0].title);
    assert.strictEqual(parsed[0].notes, sampleBookmarks[0].notes);
    assert.deepStrictEqual(parsed[0].tags, sampleBookmarks[0].tags);
  });

  it('should export to Netscape HTML format properly', () => {
    const htmlStr = exportToNetscapeHTML(sampleBookmarks);
    assert.match(htmlStr, /<!DOCTYPE NETSCAPE-Bookmark-file-1>/);
    assert.match(htmlStr, /HREF="https:\/\/example\.com\/doc"/);
    assert.match(htmlStr, /TAGS="docs,tutorial"/);
    assert.match(htmlStr, /\[Notes\]:/);
  });
});
