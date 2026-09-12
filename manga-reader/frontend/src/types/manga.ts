export type LibraryCategory = 'reading' | 'plan_to_read' | 'finished' | 'dropped';

export interface Manga {
  id: string;
  title: string;
  alt_titles?: string[];
  description: string;
  cover_url: string;
  status: string; // ongoing, completed, hiatus, cancelled
  year?: number;
  content_rating: string;
  tags: string[];
  original_language: string;
  authors?: string[];
  artists?: string[];
  latest_chapter?: string;
  library_status?: LibraryCategory | 'none' | '';
  last_read_chapter?: string;
}

export interface Chapter {
  id: string;
  manga_id: string;
  volume: string;
  chapter: string;
  title: string;
  language: string;
  publish_at: string;
  pages: number;
  scanlation_group?: string;
  external_url?: string;
  is_read?: boolean;
}

export interface ChapterPages {
  chapter_id: string;
  base_url: string;
  hash: string;
  pages: string[];
  data_saver: string[];
}

export interface Tag {
  id: string;
  name: string;
  group: string;
}

export interface UserLibraryEntry {
  manga_id: string;
  title: string;
  cover_url: string;
  status: LibraryCategory;
  last_read_chapter_id?: string;
  last_read_chapter_num?: string;
  last_read_chapter_title?: string;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryStats {
  total: number;
  reading: number;
  plan_to_read: number;
  finished: number;
  dropped: number;
}
