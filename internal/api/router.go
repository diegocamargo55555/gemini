package api

import (
	"net/http"

	"portfolio/internal/repository"
)

// NewRouter registra todas as rotas da API REST
func NewRouter(repo repository.Repository) http.Handler {
	mux := http.NewServeMux()
	h := NewHandlers(repo)

	// Endpoints da API
	mux.HandleFunc("GET /api/health", h.Health)
	mux.HandleFunc("GET /api/projects", h.GetProjects)
	mux.HandleFunc("GET /api/projects/{slug}", h.GetProjectBySlug)
	mux.HandleFunc("POST /api/projects/{slug}/view", h.IncrementViews)
	mux.HandleFunc("POST /api/contact", h.CreateContact)
	mux.HandleFunc("GET /api/stats", h.GetStats)

	// Aplica middlewares globais
	var handler http.Handler = mux
	handler = CORSMiddleware(handler)
	return handler
}
