package repository

import (
	"context"

	"manga-reader/internal/domain"
)

// LibraryRepository defines storage operations for user's manga library
type LibraryRepository interface {
	SaveLibraryEntry(ctx context.Context, entry *domain.UserLibraryEntry) error
	GetLibraryEntry(ctx context.Context, mangaID string) (*domain.UserLibraryEntry, error)
	ListLibrary(ctx context.Context, status domain.LibraryStatus) ([]*domain.UserLibraryEntry, error)
	DeleteLibraryEntry(ctx context.Context, mangaID string) error
	UpdateReadingProgress(ctx context.Context, mangaID, chapterID, chapterNum, chapterTitle string) error
	GetLibraryStats(ctx context.Context) (*domain.LibraryStats, error)
	Close() error
}
