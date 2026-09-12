import React, { useState, useEffect } from 'react';
import { Manga, Chapter, LibraryCategory, LibraryStats } from './types/manga';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { MangaDetailPage } from './pages/MangaDetailPage';
import { LibraryPage } from './pages/LibraryPage';
import { Reader } from './components/Reader';
import { api } from './services/api';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'manga' | 'reader' | 'library'>('home');
  const [selectedMangaId, setSelectedMangaId] = useState<string | null>(null);
  const [selectedMangaTitle, setSelectedMangaTitle] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterFeed, setChapterFeed] = useState<Chapter[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<LibraryCategory | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stats, setStats] = useState<LibraryStats | undefined>(undefined);

  const refreshStats = async () => {
    try {
      const s = await api.getLibraryStats();
      setStats(s);
    } catch (err) {
      console.warn('Could not fetch library stats', err);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  // Handlers for navigation
  const handleSelectManga = (manga: Manga) => {
    setSelectedMangaId(manga.id);
    setSelectedMangaTitle(manga.title);
    setCurrentView('manga');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMangaId = (mangaId: string) => {
    setSelectedMangaId(mangaId);
    setSelectedMangaTitle('');
    setCurrentView('manga');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectChapter = (chapter: Chapter, allChapters?: Chapter[]) => {
    setSelectedChapter(chapter);
    if (allChapters) {
      setChapterFeed(allChapters);
    }
    setCurrentView('reader');
    window.scrollTo({ top: 0 });
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    setSelectedMangaId(null);
    setSelectedChapter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateLibrary = (category?: LibraryCategory) => {
    setLibraryFilter(category);
    setCurrentView('library');
    setSelectedMangaId(null);
    setSelectedChapter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReaderBack = () => {
    if (selectedMangaId) {
      setCurrentView('manga');
    } else {
      setCurrentView('home');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans">
      {/* Show Navbar when not in fullscreen reader */}
      {currentView !== 'reader' && (
        <Navbar
          currentView={currentView === 'library' ? 'library' : 'home'}
          onNavigateHome={handleNavigateHome}
          onNavigateLibrary={handleNavigateLibrary}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentView !== 'home') setCurrentView('home');
          }}
          stats={stats}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            onSelectManga={handleSelectManga}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onLibraryUpdated={refreshStats}
          />
        )}

        {currentView === 'manga' && selectedMangaId && (
          <MangaDetailPage
            mangaId={selectedMangaId}
            onBack={handleNavigateHome}
            onSelectChapter={(chap, allChaps) => handleSelectChapter(chap, allChaps)}
            onLibraryUpdated={refreshStats}
          />
        )}

        {currentView === 'reader' && selectedChapter && (
          <Reader
            mangaId={selectedMangaId || selectedChapter.manga_id}
            mangaTitle={selectedMangaTitle || 'Mangá'}
            chapter={selectedChapter}
            allChapters={chapterFeed}
            onBack={handleReaderBack}
            onSelectChapter={(ch) => handleSelectChapter(ch)}
            onProgressUpdated={refreshStats}
          />
        )}

        {currentView === 'library' && (
          <LibraryPage
            initialFilter={libraryFilter}
            onSelectMangaId={handleSelectMangaId}
            onExploreCatalog={handleNavigateHome}
            stats={stats}
            onLibraryUpdated={refreshStats}
          />
        )}
      </main>

      {/* Global Footer (when not reading) */}
      {currentView !== 'reader' && (
        <footer className="border-t border-gray-900 bg-[#07090e] py-8 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-gray-400">MangaDex Reader & Library</span> — Desenvolvido com Go, React, TypeScript e TailwindCSS.
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <span>Categorias: Lendo • Pretendo Ler • Concluído • Dropado</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
