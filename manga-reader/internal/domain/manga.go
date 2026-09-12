package domain

import (
	"errors"
	"time"
)

// Manga represents a manga entity retrieved from MangaDex
type Manga struct {
	ID               string   `json:"id"`
	Title            string   `json:"title"`
	AltTitles        []string `json:"alt_titles,omitempty"`
	Description      string   `json:"description"`
	CoverURL         string   `json:"cover_url"`
	Status           string   `json:"status"` // ongoing, completed, hiatus, cancelled
	Year             int      `json:"year,omitempty"`
	ContentRating    string   `json:"content_rating"` // safe, suggestive, etc.
	Tags             []string `json:"tags"`
	OriginalLanguage string   `json:"original_language"`
	Authors          []string `json:"authors,omitempty"`
	Artists          []string `json:"artists,omitempty"`
	LatestChapter    string   `json:"latest_chapter,omitempty"`
	LibraryStatus    string   `json:"library_status,omitempty"` // reading, dropped, plan_to_read, finished
	LastReadChapter  string   `json:"last_read_chapter,omitempty"`
}

// Chapter represents a single chapter in a manga feed
type Chapter struct {
	ID              string    `json:"id"`
	MangaID         string    `json:"manga_id"`
	Volume          string    `json:"volume"`
	Chapter         string    `json:"chapter"`
	Title           string    `json:"title"`
	Language        string    `json:"language"`
	PublishAt       time.Time `json:"publish_at"`
	Pages           int       `json:"pages"`
	ScanlationGroup string    `json:"scanlation_group,omitempty"`
	ExternalURL     string    `json:"external_url,omitempty"`
	IsRead          bool      `json:"is_read,omitempty"`
}

// ChapterPages contains page URLs returned by MangaDex @Home
type ChapterPages struct {
	ChapterID string   `json:"chapter_id"`
	BaseURL   string   `json:"base_url"`
	Hash      string   `json:"hash"`
	Pages     []string `json:"pages"`
	DataSaver []string `json:"data_saver"`
}

// Tag represents a genre or theme tag
type Tag struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Group string `json:"group"`
}

// MangaFilter options for searching and listing
type MangaFilter struct {
	Query     string
	Tags      []string
	Status    string
	Order     string // followedCount, relevance, latestUploadedChapter, title
	OrderDir  string // asc, desc
	Limit     int
	Offset    int
	Languages []string
}

// SetDefaults validates filter parameters
func (f *MangaFilter) SetDefaults() {
	if f.Limit <= 0 || f.Limit > 100 {
		f.Limit = 24
	}
	if f.Offset < 0 {
		f.Offset = 0
	}
	if f.Order == "" {
		if f.Query != "" {
			f.Order = "relevance"
		} else {
			f.Order = "followedCount"
		}
	}
	if f.OrderDir == "" {
		f.OrderDir = "desc"
	}
}

var (
	ErrMangaNotFound   = errors.New("manga not found")
	ErrChapterNotFound = errors.New("chapter not found")
)
