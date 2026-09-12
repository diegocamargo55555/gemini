package mangadex

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"manga-reader/internal/domain"
)

func TestClient_SearchManga(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/manga" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{
				"result": "ok",
				"response": "collection",
				"data": [
					{
						"id": "test-manga-1",
						"type": "manga",
						"attributes": {
							"title": {"en": "Solo Leveling", "pt-br": "Solo Leveling PT"},
							"description": {"en": "Hunter Sung Jinwoo"},
							"status": "completed",
							"tags": [{"id": "t1", "attributes": {"name": {"en": "Action"}}}]
						},
						"relationships": [
							{"id": "c1", "type": "cover_art", "attributes": {"fileName": "cover.jpg"}}
						]
					}
				],
				"limit": 24,
				"offset": 0,
				"total": 1
			}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

	client := &Client{
		httpClient: &http.Client{Timeout: 5 * time.Second},
		baseURL:    ts.URL,
		cache:      NewMemoryCache(),
	}

	result, err := client.SearchManga(context.Background(), domain.MangaFilter{Query: "Solo"})
	if err != nil {
		t.Fatalf("search failed: %v", err)
	}

	if len(result.Data) != 1 {
		t.Fatalf("expected 1 result, got %d", len(result.Data))
	}

	manga := result.Data[0]
	if manga.ID != "test-manga-1" {
		t.Errorf("expected id 'test-manga-1', got '%s'", manga.ID)
	}
	if manga.Title != "Solo Leveling PT" {
		t.Errorf("expected pt-br title 'Solo Leveling PT', got '%s'", manga.Title)
	}
	if manga.CoverURL != "https://uploads.mangadex.org/covers/test-manga-1/cover.jpg.512.jpg" {
		t.Errorf("unexpected cover URL: %s", manga.CoverURL)
	}
}

func TestClient_GetChapterPages(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/at-home/server/chap-123" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{
				"result": "ok",
				"baseUrl": "https://network.mangadex.org",
				"chapter": {
					"hash": "abc123hash",
					"data": ["page1.jpg", "page2.jpg"],
					"dataSaver": ["page1_s.jpg", "page2_s.jpg"]
				}
			}`))
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

	client := &Client{
		httpClient: &http.Client{Timeout: 5 * time.Second},
		baseURL:    ts.URL,
		cache:      NewMemoryCache(),
	}

	pages, err := client.GetChapterPages(context.Background(), "chap-123")
	if err != nil {
		t.Fatalf("get pages failed: %v", err)
	}

	if len(pages.Pages) != 2 {
		t.Fatalf("expected 2 pages, got %d", len(pages.Pages))
	}
	if pages.Pages[0] != "https://network.mangadex.org/data/abc123hash/page1.jpg" {
		t.Errorf("unexpected page 0 url: %s", pages.Pages[0])
	}
}
