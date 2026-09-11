import { Bookmark } from '../db/schema';

export interface BackupFormat {
  version: string;
  source: string;
  exportedAt: string;
  bookmarks: Bookmark[];
}

export function exportToJSON(bookmarks: Bookmark[]): string {
  const data: BackupFormat = {
    version: '1.0',
    source: 'pinscribe',
    exportedAt: new Date().toISOString(),
    bookmarks: bookmarks,
  };
  return JSON.stringify(data, null, 2);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function exportToNetscapeHTML(bookmarks: Bookmark[]): string {
  const lines: string[] = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file.',
    '     It will be read and overwritten.',
    '     DO NOT EDIT! -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ];

  for (const bm of bookmarks) {
    const addDate = Math.floor(bm.createdAt / 1000);
    const tagsStr = bm.tags.join(',');
    const title = escapeHtml(bm.title || bm.url);
    const url = escapeHtml(bm.url);

    lines.push(`    <DT><A HREF="${url}" ADD_DATE="${addDate}" TAGS="${escapeHtml(tagsStr)}">${title}</A>`);

    // Combine description and notes into <DD> if available
    const notesParts: string[] = [];
    if (bm.description) {
      notesParts.push(bm.description);
    }
    if (bm.notes) {
      notesParts.push(`[Notes]:\n${bm.notes}`);
    }
    if (notesParts.length > 0) {
      lines.push(`    <DD>${escapeHtml(notesParts.join('\n\n'))}`);
    }
  }

  lines.push('</DL><p>');
  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
