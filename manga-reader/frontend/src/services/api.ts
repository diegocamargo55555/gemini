import {
  Manga,
  Chapter,
  ChapterPages,
  Tag,
  UserLibraryEntry,
  LibraryStats,
  LibraryCategory,
} from '../types/manga';

const API_BASE = '/api';

export interface SearchOptions {
  q?: string;
  tags?: string[];
  order?: 'followedCount' | 'relevance' | 'latestUploadedChapter' | 'title';
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  data: Manga[];
  total: number;
  limit: number;
  offset: number;
}

export interface ChaptersResponse {
  data: Chapter[];
  total: number;
  limit: number;
  offset: number;
}

export const api = {
  async searchManga(options: SearchOptions = {}): Promise<SearchResponse> {
    const params = new URLSearchParams();
    if (options.q) params.set('q', options.q);
    if (options.order) params.set('order', options.order);
    if (options.orderDir) params.set('order_dir', options.orderDir);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());
    if (options.tags && options.tags.length > 0) {
      params.set('tags', options.tags.join(','));
    }

    const res = await fetch(`${API_BASE}/manga?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to search manga: ${res.statusText}`);
    }
    return res.json();
  },

  async getManga(id: string): Promise<Manga> {
    const res = await fetch(`${API_BASE}/manga/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch manga details: ${res.statusText}`);
    }
    return res.json();
  },

  async getChapters(
    mangaId: string,
    options: { lang?: string[]; order?: 'asc' | 'desc'; limit?: number; offset?: number } = {}
  ): Promise<ChaptersResponse> {
    const params = new URLSearchParams();
    if (options.lang && options.lang.length > 0) {
      params.set('lang', options.lang.join(','));
    }
    if (options.order) params.set('order', options.order);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const res = await fetch(`${API_BASE}/manga/${mangaId}/chapters?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch chapters: ${res.statusText}`);
    }
    return res.json();
  },

  async getChapterPages(chapterId: string): Promise<ChapterPages> {
    const res = await fetch(`${API_BASE}/chapters/${chapterId}/pages`);
    if (!res.ok) {
      throw new Error(`Failed to fetch chapter pages: ${res.statusText}`);
    }
    return res.json();
  },

  async getTags(): Promise<Tag[]> {
    const res = await fetch(`${API_BASE}/tags`);
    if (!res.ok) {
      throw new Error(`Failed to fetch tags: ${res.statusText}`);
    }
    return res.json();
  },

  async getLibrary(status?: LibraryCategory): Promise<UserLibraryEntry[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);

    const res = await fetch(`${API_BASE}/library?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch library: ${res.statusText}`);
    }
    return res.json();
  },

  async getLibraryStats(): Promise<LibraryStats> {
    const res = await fetch(`${API_BASE}/library/stats`);
    if (!res.ok) {
      throw new Error(`Failed to fetch library stats: ${res.statusText}`);
    }
    return res.json();
  },

  async getLibraryEntry(mangaId: string): Promise<UserLibraryEntry | null> {
    const res = await fetch(`${API_BASE}/library/${mangaId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'none') return null;
    return data;
  },

  async saveLibraryEntry(entry: {
    manga_id: string;
    title: string;
    cover_url: string;
    status: LibraryCategory | 'none';
    rating?: number;
    notes?: string;
  }): Promise<UserLibraryEntry | null> {
    const res = await fetch(`${API_BASE}/library`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      throw new Error(`Failed to save library entry: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.status === 'none') return null;
    return data;
  },

  async deleteLibraryEntry(mangaId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/library/${mangaId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete library entry: ${res.statusText}`);
    }
  },

  async updateReadingProgress(
    mangaId: string,
    chapterId: string,
    chapterNum: string,
    chapterTitle?: string
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/library/${mangaId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapter_id: chapterId,
        chapter_num: chapterNum,
        chapter_title: chapterTitle,
      }),
    });
    if (!res.ok) {
      console.warn('Could not update reading progress on server', res.statusText);
    }
  },
};
