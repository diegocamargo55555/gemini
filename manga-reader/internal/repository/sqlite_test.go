package repository

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"manga-reader/internal/domain"
)

func TestSQLiteRepository_CRUD(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "manga-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")
	repo, err := NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	defer repo.Close()

	ctx := context.Background()

	// 1. Initial should be empty
	entries, err := repo.ListLibrary(ctx, "")
	if err != nil {
		t.Fatalf("list failed: %v", err)
	}
	if len(entries) != 0 {
		t.Errorf("expected 0 entries, got %d", len(entries))
	}

	// 2. Save an entry (Reading)
	entry1 := &domain.UserLibraryEntry{
		MangaID:  "manga-123",
		Title:    "Chainsaw Man",
		CoverURL: "https://example.com/cover1.jpg",
		Status:   domain.StatusReading,
		Rating:   9.5,
		Notes:    "Great manga",
	}
	if err := repo.SaveLibraryEntry(ctx, entry1); err != nil {
		t.Fatalf("save failed: %v", err)
	}

	// 3. Get entry
	saved, err := repo.GetLibraryEntry(ctx, "manga-123")
	if err != nil {
		t.Fatalf("get failed: %v", err)
	}
	if saved == nil {
		t.Fatalf("expected saved entry, got nil")
	}
	if saved.Title != "Chainsaw Man" || saved.Status != domain.StatusReading {
		t.Errorf("unexpected entry data: %+v", saved)
	}

	// 4. Save second entry (Plan to Read)
	entry2 := &domain.UserLibraryEntry{
		MangaID:  "manga-456",
		Title:    "One Piece",
		CoverURL: "https://example.com/cover2.jpg",
		Status:   domain.StatusPlanToRead,
	}
	if err := repo.SaveLibraryEntry(ctx, entry2); err != nil {
		t.Fatalf("save entry2 failed: %v", err)
	}

	// 5. Test stats
	stats, err := repo.GetLibraryStats(ctx)
	if err != nil {
		t.Fatalf("stats failed: %v", err)
	}
	if stats.Total != 2 || stats.Reading != 1 || stats.PlanToRead != 1 {
		t.Errorf("unexpected stats: %+v", stats)
	}

	// 6. Test filtering by status
	readingList, err := repo.ListLibrary(ctx, domain.StatusReading)
	if err != nil {
		t.Fatalf("list reading failed: %v", err)
	}
	if len(readingList) != 1 || readingList[0].MangaID != "manga-123" {
		t.Errorf("unexpected reading list: %+v", readingList)
	}

	// 7. Update progress
	err = repo.UpdateReadingProgress(ctx, "manga-123", "chap-99", "99", "Chapter 99")
	if err != nil {
		t.Fatalf("update progress failed: %v", err)
	}
	updated, _ := repo.GetLibraryEntry(ctx, "manga-123")
	if updated.LastReadChapterID != "chap-99" || updated.LastReadChapterNum != "99" {
		t.Errorf("progress not updated properly: %+v", updated)
	}

	// 8. Delete
	if err := repo.DeleteLibraryEntry(ctx, "manga-123"); err != nil {
		t.Fatalf("delete failed: %v", err)
	}
	deleted, err := repo.GetLibraryEntry(ctx, "manga-123")
	if err != nil {
		t.Fatalf("get after delete failed: %v", err)
	}
	if deleted != nil {
		t.Errorf("expected nil after delete, got %+v", deleted)
	}
}
