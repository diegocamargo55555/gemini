package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// SetupRouter registers all HTTP routes and returns the top-level handler
func SetupRouter(h *Handler, staticDir string) http.Handler {
	mux := http.NewServeMux()

	// API Routes
	mux.HandleFunc("GET /api/health", h.HealthCheck)
	mux.HandleFunc("GET /api/manga", h.SearchManga)
	mux.HandleFunc("GET /api/manga/{id}", h.GetManga)
	mux.HandleFunc("GET /api/manga/{id}/chapters", h.GetChapters)
	mux.HandleFunc("GET /api/chapters/{chapterId}/pages", h.GetChapterPages)
	mux.HandleFunc("GET /api/tags", h.GetTags)

	// Library Category Routes
	mux.HandleFunc("GET /api/library", h.ListLibrary)
	mux.HandleFunc("GET /api/library/stats", h.GetLibraryStats)
	mux.HandleFunc("GET /api/library/{mangaId}", h.GetLibraryEntry)
	mux.HandleFunc("POST /api/library", h.SaveLibraryEntry)
	mux.HandleFunc("DELETE /api/library/{mangaId}", h.DeleteLibraryEntry)
	mux.HandleFunc("PUT /api/library/{mangaId}/progress", h.UpdateProgress)

	// Static SPA Files
	spaHandler := newSPAHandler(staticDir)
	mux.Handle("/", spaHandler)

	// Middleware chain: Recovery -> CORS -> Logging -> mux
	var handler http.Handler = mux
	handler = CORSMiddleware(handler)
	handler = LoggingMiddleware(handler)
	handler = RecoveryMiddleware(handler)

	return handler
}

type spaHandler struct {
	staticDir string
}

func newSPAHandler(staticDir string) http.Handler {
	return &spaHandler{staticDir: staticDir}
}

func (h *spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// If path starts with /api/, do not serve SPA
	if strings.HasPrefix(r.URL.Path, "/api/") {
		http.NotFound(w, r)
		return
	}

	path := filepath.Join(h.staticDir, filepath.Clean(r.URL.Path))

	// Check if requested file exists and is not a directory
	info, err := os.Stat(path)
	if err == nil && !info.IsDir() {
		http.ServeFile(w, r, path)
		return
	}

	// Fallback to index.html for SPA client-side routing
	indexPath := filepath.Join(h.staticDir, "index.html")
	if _, err := os.Stat(indexPath); err == nil {
		http.ServeFile(w, r, indexPath)
		return
	}

	// Default fallback if frontend dist is not built yet
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(`<!DOCTYPE html>
<html>
<head><title>Manga Reader API</title></head>
<body style="font-family:sans-serif; background:#0b0f19; color:#f3f4f6; padding:2rem;">
	<h1>Manga Reader API is running</h1>
	<p>Frontend dist not found at ` + h.staticDir + `. Build frontend or use Vite dev server.</p>
	<p><a href="/api/health" style="color:#818cf8">/api/health</a></p>
	<p><a href="/api/manga" style="color:#818cf8">/api/manga</a></p>
</body>
</html>`))
}
