export interface Bookmark {
  id: string;
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

export interface TagStats {
  name: string;
  count: number;
}

export type BookmarkFilter = 'all' | 'unread' | 'archived';

export interface SearchQuery {
  text?: string;
  tags?: string[];
  filter?: BookmarkFilter;
}
