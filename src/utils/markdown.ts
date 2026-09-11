import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdown(markdownText: string): string {
  if (!markdownText) return '';
  try {
    return marked.parse(markdownText) as string;
  } catch (err) {
    console.error('Failed to parse markdown', err);
    return markdownText;
  }
}
