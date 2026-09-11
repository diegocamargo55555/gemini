package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"portfolio/internal/domain"
	"portfolio/internal/repository"
)

type Handlers struct {
	repo repository.Repository
}

func NewHandlers(repo repository.Repository) *Handlers {
	return &Handlers{repo: repo}
}

// HealthHandler verifica o status da aplicação e do repositório
func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	dbStatus := "ok"
	if err := h.repo.Ping(r.Context()); err != nil {
		dbStatus = "error: " + err.Error()
	}

	JSONResponse(w, http.StatusOK, map[string]string{
		"status": "ok",
		"db":     dbStatus,
	})
}

// GetProjects retorna todos os projetos ou filtrados por categoria/tag
func (h *Handlers) GetProjects(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	tag := r.URL.Query().Get("tag")

	projects, err := h.repo.GetAllProjects(r.Context(), category, tag)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "erro ao obter projetos")
		return
	}

	JSONResponse(w, http.StatusOK, projects)
}

// GetProjectBySlug busca um projeto específico pelo slug
func (h *Handlers) GetProjectBySlug(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		ErrorResponse(w, http.StatusBadRequest, "slug não informado")
		return
	}

	project, err := h.repo.GetProjectBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, domain.ErrProjectNotFound) {
			ErrorResponse(w, http.StatusNotFound, "projeto não encontrado")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "erro interno")
		return
	}

	JSONResponse(w, http.StatusOK, project)
}

// IncrementViews incrementa as visualizações de um projeto
func (h *Handlers) IncrementViews(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		ErrorResponse(w, http.StatusBadRequest, "slug não informado")
		return
	}

	views, err := h.repo.IncrementProjectViews(r.Context(), slug)
	if err != nil {
		if errors.Is(err, domain.ErrProjectNotFound) {
			ErrorResponse(w, http.StatusNotFound, "projeto não encontrado")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "erro ao contabilizar visualização")
		return
	}

	JSONResponse(w, http.StatusOK, map[string]int64{"views": views})
}

// CreateContact recebe uma mensagem de contato
func (h *Handlers) CreateContact(w http.ResponseWriter, r *http.Request) {
	var msg domain.ContactMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if err := msg.Validate(); err != nil {
		ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.repo.SaveContactMessage(r.Context(), &msg); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "falha ao salvar mensagem de contato")
		return
	}

	JSONResponse(w, http.StatusCreated, msg)
}

// GetStats retorna métricas gerais
func (h *Handlers) GetStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.GetStats(r.Context())
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "falha ao obter estatísticas")
		return
	}

	JSONResponse(w, http.StatusOK, stats)
}
