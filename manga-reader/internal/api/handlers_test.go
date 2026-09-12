package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"manga-reader/internal/domain"
	"manga-reader/internal/mangadex"
	"manga-reader/internal/repository"
)

func setupTestServer(t *testing.T) (*httptest.Server, repository.LibraryRepository) {
	tempDir, err := os.MkdirTemp("", "manga-api-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	t.Cleanup(func() { os.RemoveAll(tempDir) })

	dbPath := filepath.Join(tempDir, "test.db")
	repo, err := repository.NewSQLiteRepository(dbPath)
	if err != nil {
		t.Fatalf("failed to init sqlite repo: %v", err)
	}
	t.Cleanup(func() { repo.Close() })

	mdClient := mangadex.NewClient()
	handler := NewHandler(repo, mdClient)
	router := SetupRouter(handler, tempDir)

	ts := httptest.NewServer(router)
	t.Cleanup(func() { ts.Close() })

	return ts, repo
}

func TestAPI_HealthCheck(t *testing.T) {
	ts, _ := setupTestServer(t)

	resp, err := http.Get(ts.URL + "/api/health")
	if err != nil {
		t.Fatalf("health check failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var body map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if body["status"] != "ok" {
		t.Errorf("expected status ok, got %v", body["status"])
	}
}

func TestAPI_LibraryCRUD(t *testing.T) {
	ts, repo := setupTestServer(t)

	// 1. Initial library should be empty
	resp, err := http.Get(ts.URL + "/api/library")
	if err != nil {
		t.Fatalf("get library failed: %v", err)
	}
	defer resp.Body.Close()

	var list []*domain.UserLibraryEntry
	json.NewDecoder(resp.Body).Decode(&list)
	if len(list) != 0 {
		t.Errorf("expected empty list, got %d", len(list))
	}

	// 2. Save manga to 'reading' category
	payload := domain.UpdateLibraryRequest{
		MangaID:  "manga-abc",
		Title:    "Chainsaw Man",
		CoverURL: "https://example.com/cover.jpg",
		Status:   domain.StatusReading,
		Rating:   9.0,
		Notes:    "Loving this series",
	}
	bodyBytes, _ := json.Marshal(payload)
	postResp, err := http.Post(ts.URL+"/api/library", "application/json", bytes.NewReader(bodyBytes))
	if err != nil {
		t.Fatalf("post library failed: %v", err)
	}
	defer postResp.Body.Close()

	if postResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on post, got %d", postResp.StatusCode)
	}

	var saved domain.UserLibraryEntry
	json.NewDecoder(postResp.Body).Decode(&saved)
	if saved.MangaID != "manga-abc" || saved.Status != domain.StatusReading {
		t.Errorf("unexpected saved item: %+v", saved)
	}

	// 3. Check stats
	statsResp, err := http.Get(ts.URL + "/api/library/stats")
	if err != nil {
		t.Fatalf("get stats failed: %v", err)
	}
	defer statsResp.Body.Close()

	var stats domain.LibraryStats
	json.NewDecoder(statsResp.Body).Decode(&stats)
	if stats.Total != 1 || stats.Reading != 1 {
		t.Errorf("unexpected stats: %+v", stats)
	}

	// 4. Update reading progress
	progPayload := domain.UpdateProgressRequest{
		ChapterID:    "chap-50",
		ChapterNum:   "50",
		ChapterTitle: "Shark Fight",
	}
	progBytes, _ := json.Marshal(progPayload)
	req, _ := http.NewRequest(http.MethodPut, ts.URL+"/api/library/manga-abc/progress", bytes.NewReader(progBytes))
	req.Header.Set("Content-Type", "application/json")
	putResp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("update progress failed: %v", err)
	}
	defer putResp.Body.Close()

	if putResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on put progress, got %d", putResp.StatusCode)
	}

	// Verify progress in repo
	entry, _ := repo.GetLibraryEntry(context.Background(), "manga-abc")
	if entry.LastReadChapterNum != "50" {
		t.Errorf("expected last read 50, got %s", entry.LastReadChapterNum)
	}

	// 5. Change category to 'finished'
	payload.Status = domain.StatusFinished
	bodyBytes, _ = json.Marshal(payload)
	postResp2, err := http.Post(ts.URL+"/api/library", "application/json", bytes.NewReader(bodyBytes))
	if err != nil {
		t.Fatalf("post change status failed: %v", err)
	}
	defer postResp2.Body.Close()

	var finishedEntry domain.UserLibraryEntry
	json.NewDecoder(postResp2.Body).Decode(&finishedEntry)
	if finishedEntry.Status != domain.StatusFinished {
		t.Errorf("expected status finished, got %s", finishedEntry.Status)
	}

	// 6. Delete from library
	delReq, _ := http.NewRequest(http.MethodDelete, ts.URL+"/api/library/manga-abc", nil)
	delResp, err := http.DefaultClient.Do(delReq)
	if err != nil {
		t.Fatalf("delete failed: %v", err)
	}
	defer delResp.Body.Close()

	if delResp.StatusCode != http.StatusOK {
		t.Errorf("expected 200 on delete, got %d", delResp.StatusCode)
	}

	// Verify deleted
	delEntry, _ := repo.GetLibraryEntry(context.Background(), "manga-abc")
	if delEntry != nil {
		t.Errorf("expected nil after delete, got %+v", delEntry)
	}
}

func TestAPI_InvalidCategory(t *testing.T) {
	ts, _ := setupTestServer(t)

	payload := domain.UpdateLibraryRequest{
		MangaID: "manga-xyz",
		Title:   "Invalid Test",
		Status:  domain.LibraryStatus("non_existent_status"),
	}
	bodyBytes, _ := json.Marshal(payload)
	resp, err := http.Post(ts.URL+"/api/library", "application/json", bytes.NewReader(bodyBytes))
	if err != nil {
		t.Fatalf("post failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 bad request, got %d", resp.StatusCode)
	}
}
