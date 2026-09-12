package domain

import (
	"errors"
	"time"
)

// LibraryStatus represents the tracking status of a manga
type LibraryStatus string

const (
	StatusReading    LibraryStatus = "reading"
	StatusPlanToRead LibraryStatus = "plan_to_read"
	StatusFinished   LibraryStatus = "finished"
	StatusDropped    LibraryStatus = "dropped"
)

// IsValid checks whether status is one of the supported categories
func (s LibraryStatus) IsValid() bool {
	switch s {
	case StatusReading, StatusPlanToRead, StatusFinished, StatusDropped:
		return true
	default:
		return false
	}
}

// UserLibraryEntry represents a tracked manga in user's library
type UserLibraryEntry struct {
	MangaID              string        `json:"manga_id"`
	Title                string        `json:"title"`
	CoverURL             string        `json:"cover_url"`
	Status               LibraryStatus `json:"status"`
	LastReadChapterID    string        `json:"last_read_chapter_id,omitempty"`
	LastReadChapterNum   string        `json:"last_read_chapter_num,omitempty"`
	LastReadChapterTitle string        `json:"last_read_chapter_title,omitempty"`
	Rating               float64       `json:"rating,omitempty"`
	Notes                string        `json:"notes,omitempty"`
	CreatedAt            time.Time     `json:"created_at"`
	UpdatedAt            time.Time     `json:"updated_at"`
}

// UpdateLibraryRequest payload for setting or updating status
type UpdateLibraryRequest struct {
	MangaID              string        `json:"manga_id"`
	Title                string        `json:"title"`
	CoverURL             string        `json:"cover_url"`
	Status               LibraryStatus `json:"status"`
	Rating               float64       `json:"rating,omitempty"`
	Notes                string        `json:"notes,omitempty"`
	LastReadChapterID    string        `json:"last_read_chapter_id,omitempty"`
	LastReadChapterNum   string        `json:"last_read_chapter_num,omitempty"`
	LastReadChapterTitle string        `json:"last_read_chapter_title,omitempty"`
}

// UpdateProgressRequest payload for updating chapter reading progress
type UpdateProgressRequest struct {
	ChapterID    string `json:"chapter_id"`
	ChapterNum   string `json:"chapter_num"`
	ChapterTitle string `json:"chapter_title,omitempty"`
}

// LibraryStats provides count of mangas per category
type LibraryStats struct {
	Total      int `json:"total"`
	Reading    int `json:"reading"`
	PlanToRead int `json:"plan_to_read"`
	Finished   int `json:"finished"`
	Dropped    int `json:"dropped"`
}

var (
	ErrInvalidStatus = errors.New("invalid library category status (must be reading, plan_to_read, finished, or dropped)")
	ErrEmptyMangaID  = errors.New("manga_id is required")
)
