import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, BookOpen } from 'lucide-react';
import { Manga, UserLibraryEntry } from '../types/manga';
import { CategoryBadge } from './CategoryBadge';
import { StatusModal } from './StatusModal';

interface MangaCardProps {
  manga: Manga;
  onSelect: (manga: Manga) => void;
  onStatusUpdated?: () => void;
}

export const MangaCard: React.FC<MangaCardProps> = ({ manga, onSelect, onStatusUpdated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fallbackCover =
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80';

  const hasStatus = manga.library_status && manga.library_status !== 'none';

  return (
    <>
      <div className="group relative flex flex-col bg-[#111625] rounded-xl overflow-hidden border border-gray-800/80 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
        {/* Cover Aspect Container */}
        <div
          onClick={() => onSelect(manga)}
          className="relative aspect-[3/4] w-full overflow-hidden bg-gray-900 cursor-pointer"
        >
          <img
            src={imgError || !manga.cover_url ? fallbackCover : manga.cover_url}
            alt={manga.title}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#111625] via-transparent to-black/40 opacity-80 group-hover:opacity-90 transition-opacity" />

          {/* Publication status pill */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {manga.status && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-md ${
                  manga.status === 'completed'
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-600/30'
                    : 'bg-emerald-900/80 text-emerald-200 border border-emerald-600/30'
                }`}
              >
                {manga.status === 'completed' ? 'Completo' : 'Em lançamento'}
              </span>
            )}

            {/* Library Category Badge overlay */}
            {hasStatus && (
              <CategoryBadge status={manga.library_status} size="sm" showIcon={true} />
            )}
          </div>

          {/* Quick status bookmark button */}
          <button
            type="button"
            title="Alterar categoria na biblioteca"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md transition-all z-10 ${
              hasStatus
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50 ring-2 ring-indigo-400/50'
                : 'bg-black/60 text-gray-300 hover:text-white hover:bg-black/90'
            }`}
          >
            {hasStatus ? (
              <BookmarkCheck className="w-4 h-4 text-white" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          {/* Last read chapter tag if available */}
          {manga.last_read_chapter && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-medium text-emerald-400 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/30">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>Cap. {manga.last_read_chapter}</span>
              </span>
              <span className="text-[10px] text-gray-400">Progresso</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div
          onClick={() => onSelect(manga)}
          className="p-3.5 flex flex-col flex-1 justify-between cursor-pointer"
        >
          <div>
            <h3
              title={manga.title}
              className="text-sm font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug"
            >
              {manga.title}
            </h3>

            {/* Genres / Tags */}
            {manga.tags && manga.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {manga.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-gray-400 bg-gray-800/60 px-1.5 py-0.5 rounded border border-gray-700/40"
                  >
                    {tag}
                  </span>
                ))}
                {manga.tags.length > 2 && (
                  <span className="text-[10px] text-gray-500 py-0.5">
                    +{manga.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
            <span>{manga.year ? manga.year : 'MangaDex'}</span>
            <span className="uppercase text-[10px] tracking-wider text-gray-500">
              {manga.original_language || 'JA'}
            </span>
          </div>
        </div>
      </div>

      <StatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        manga={manga}
        currentEntry={
          hasStatus
            ? ({
                manga_id: manga.id,
                title: manga.title,
                cover_url: manga.cover_url,
                status: manga.library_status as any,
              } as UserLibraryEntry)
            : null
        }
        onSaved={(_status) => {
          if (onStatusUpdated) onStatusUpdated();
        }}
      />
    </>
  );
};
