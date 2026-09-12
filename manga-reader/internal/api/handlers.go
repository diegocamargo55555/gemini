package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"manga-reader/internal/domain"
	"manga-reader/internal/mangadex"
	"manga-reader/internal/repository"
)

type Handler struct {
	repo    repository.LibraryRepository
	md      *mangadex.Client
}

func NewHandler(repo repository.LibraryRepository, md *mangadex.Client) *Handler {
	return &Handler{
		repo: repo,
		md:   md,
	}
}

func (h *Handler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if data != nil {
		_ = json.NewEncoder(w).Encode(data)
	}
}

func (h *Handler) respondError(w http.ResponseWriter, status int, message string) {
	h.respondJSON(w, status, map[string]string{"error": message})
}

// HealthCheck handles GET /api/health
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

// SearchManga handles GET /api/manga
func (h *Handler) SearchManga(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")
	order := r.URL.Query().Get("order")
	orderDir := r.URL.Query().Get("order_dir")
	tagsStr := r.URL.Query().Get("tags")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	var tags []string
	if tagsStr != "" {
		tags = strings.Split(tagsStr, ",")
	}

	filter := domain.MangaFilter{
		Query:    query,
		Tags:     tags,
		Order:    order,
		OrderDir: orderDir,
		Limit:    limit,
		Offset:   offset,
	}

	result, err := h.md.SearchManga(r.Context(), filter)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Enrich with user library state
	for _, m := range result.Data {
		if entry, _ := h.repo.GetLibraryEntry(r.Context(), m.ID); entry != nil {
			m.LibraryStatus = string(entry.Status)
			m.LastReadChapter = entry.LastReadChapterNum
		}
	}

	h.respondJSON(w, http.StatusOK, result)
}

// GetManga handles GET /api/manga/{id}
func (h *Handler) GetManga(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		h.respondError(w, http.StatusBadRequest, "missing manga id")
		return
	}

	manga, err := h.md.GetMangaByID(r.Context(), id)
	if errors.Is(err, domain.ErrMangaNotFound) {
		h.respondError(w, http.StatusNotFound, "manga not found")
		return
	}
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Enrich with user library state
	if entry, _ := h.repo.GetLibraryEntry(r.Context(), manga.ID); entry != nil {
		manga.LibraryStatus = string(entry.Status)
		manga.LastReadChapter = entry.LastReadChapterNum
	}

	h.respondJSON(w, http.StatusOK, manga)
}

// GetChapters handles GET /api/manga/{id}/chapters
func (h *Handler) GetChapters(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		h.respondError(w, http.StatusBadRequest, "missing manga id")
		return
	}

	langParam := r.URL.Query().Get("lang")
	var languages []string
	if langParam != "" {
		languages = strings.Split(langParam, ",")
	} else {
		languages = []string{"pt-br", "en"}
	}

	order := r.URL.Query().Get("order")
	if order == "" {
		order = "desc"
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	chapters, total, err := h.md.GetMangaFeed(r.Context(), id, languages, order, limit, offset)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Check if user has read chapters
	if entry, _ := h.repo.GetLibraryEntry(r.Context(), id); entry != nil && entry.LastReadChapterNum != "" {
		lastNum, parseErr := strconv.ParseFloat(entry.LastReadChapterNum, 64)
		for _, chap := range chapters {
			if chap.ID == entry.LastReadChapterID {
				chap.IsRead = true
				continue
			}
			if parseErr == nil && chap.Chapter != "" {
				if cNum, err := strconv.ParseFloat(chap.Chapter, 64); err == nil {
					if cNum <= lastNum {
						chap.IsRead = true
					}
				}
			}
		}
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":   chapters,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetChapterPages handles GET /api/chapters/{chapterId}/pages
func (h *Handler) GetChapterPages(w http.ResponseWriter, r *http.Request) {
	chapterID := r.PathValue("chapterId")
	if chapterID == "" {
		h.respondError(w, http.StatusBadRequest, "missing chapter id")
		return
	}

	pages, err := h.md.GetChapterPages(r.Context(), chapterID)
	if errors.Is(err, domain.ErrChapterNotFound) {
		h.respondError(w, http.StatusNotFound, "chapter not found")
		return
	}
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, pages)
}

// GetTags handles GET /api/tags
func (h *Handler) GetTags(w http.ResponseWriter, r *http.Request) {
	tags, err := h.md.GetTags(r.Context())
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.respondJSON(w, http.StatusOK, tags)
}

// ListLibrary handles GET /api/library
func (h *Handler) ListLibrary(w http.ResponseWriter, r *http.Request) {
	status := domain.LibraryStatus(r.URL.Query().Get("status"))
	entries, err := h.repo.ListLibrary(r.Context(), status)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if entries == nil {
		entries = []*domain.UserLibraryEntry{}
	}
	h.respondJSON(w, http.StatusOK, entries)
}

// GetLibraryStats handles GET /api/library/stats
func (h *Handler) GetLibraryStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.GetLibraryStats(r.Context())
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.respondJSON(w, http.StatusOK, stats)
}

// GetLibraryEntry handles GET /api/library/{mangaId}
func (h *Handler) GetLibraryEntry(w http.ResponseWriter, r *http.Request) {
	mangaID := r.PathValue("mangaId")
	if mangaID == "" {
		h.respondError(w, http.StatusBadRequest, "missing manga id")
		return
	}

	entry, err := h.repo.GetLibraryEntry(r.Context(), mangaID)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if entry == nil {
		h.respondJSON(w, http.StatusOK, map[string]interface{}{
			"manga_id": mangaID,
			"status":   "none",
		})
		return
	}

	h.respondJSON(w, http.StatusOK, entry)
}

// SaveLibraryEntry handles POST /api/library
func (h *Handler) SaveLibraryEntry(w http.ResponseWriter, r *http.Request) {
	var req domain.UpdateLibraryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.MangaID == "" {
		h.respondError(w, http.StatusBadRequest, "manga_id is required")
		return
	}

	// Status can be "none" to remove from library
	if string(req.Status) == "none" || req.Status == "" {
		_ = h.repo.DeleteLibraryEntry(r.Context(), req.MangaID)
		h.respondJSON(w, http.StatusOK, map[string]interface{}{
			"manga_id": req.MangaID,
			"status":   "none",
			"message":  "removed from library",
		})
		return
	}

	if !req.Status.IsValid() {
		h.respondError(w, http.StatusBadRequest, domain.ErrInvalidStatus.Error())
		return
	}

	entry := &domain.UserLibraryEntry{
		MangaID:              req.MangaID,
		Title:                req.Title,
		CoverURL:             req.CoverURL,
		Status:               req.Status,
		LastReadChapterID:    req.LastReadChapterID,
		LastReadChapterNum:   req.LastReadChapterNum,
		LastReadChapterTitle: req.LastReadChapterTitle,
		Rating:               req.Rating,
		Notes:                req.Notes,
	}

	if err := h.repo.SaveLibraryEntry(r.Context(), entry); err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Re-fetch to get timestamps
	saved, _ := h.repo.GetLibraryEntry(r.Context(), req.MangaID)
	h.respondJSON(w, http.StatusOK, saved)
}

// DeleteLibraryEntry handles DELETE /api/library/{mangaId}
func (h *Handler) DeleteLibraryEntry(w http.ResponseWriter, r *http.Request) {
	mangaID := r.PathValue("mangaId")
	if mangaID == "" {
		h.respondError(w, http.StatusBadRequest, "missing manga id")
		return
	}

	if err := h.repo.DeleteLibraryEntry(r.Context(), mangaID); err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]string{
		"message":  "manga removed from library",
		"manga_id": mangaID,
	})
}

// UpdateProgress handles PUT /api/library/{mangaId}/progress
func (h *Handler) UpdateProgress(w http.ResponseWriter, r *http.Request) {
	mangaID := r.PathValue("mangaId")
	if mangaID == "" {
		h.respondError(w, http.StatusBadRequest, "missing manga id")
		return
	}

	var req domain.UpdateProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.ChapterID == "" {
		h.respondError(w, http.StatusBadRequest, "chapter_id is required")
		return
	}

	if err := h.repo.UpdateReadingProgress(r.Context(), mangaID, req.ChapterID, req.ChapterNum, req.ChapterTitle); err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]string{
		"message":    "progress updated",
		"manga_id":   mangaID,
		"chapter_id": req.ChapterID,
		"chapter_num": req.ChapterNum,
	})
}
