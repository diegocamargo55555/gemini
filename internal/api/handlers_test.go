package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"portfolio/internal/api"
	"portfolio/internal/domain"
	"portfolio/internal/repository/memory"
)

func setupTestServer(t *testing.T) (*memory.MemoryRepository, http.Handler) {
	repo := memory.NewMemoryRepository()
	ctx := context.Background()

	projects := []domain.Project{
		{
			ID:               "investimentos",
			Title:            "Site de Investimentos",
			Slug:             "site-de-investimentos",
			ShortDescription: "Dashboard para ativos e ações",
			Description:      "Descrição detalhada do site de investimentos",
			Category:         "Investimentos",
			Tags:             []string{"Golang", "React", "PostgreSQL"},
			Featured:         true,
			Order:            1,
		},
		{
			ID:               "manga",
			Title:            "Site de Manga",
			Slug:             "site-de-manga",
			ShortDescription: "Leitor de mangá veloz",
			Description:      "Descrição detalhada do leitor de mangás",
			Category:         "Manga",
			Tags:             []string{"React", "Docker"},
			Featured:         true,
			Order:            2,
		},
	}

	if err := repo.SyncProjects(ctx, projects); err != nil {
		t.Fatalf("falha no setup dos projetos: %v", err)
	}

	router := api.NewRouter(repo)
	return repo, router
}

func TestGetHealth(t *testing.T) {
	_, handler := setupTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperava status 200, obteve %d", w.Code)
	}

	var resp map[string]string
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("falha ao decodificar JSON: %v", err)
	}

	if resp["status"] != "ok" {
		t.Errorf("esperava status 'ok', obteve '%s'", resp["status"])
	}
}

func TestGetProjects_All(t *testing.T) {
	_, handler := setupTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/projects", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperava status 200, obteve %d", w.Code)
	}

	var projects []domain.Project
	if err := json.NewDecoder(w.Body).Decode(&projects); err != nil {
		t.Fatalf("falha ao decodificar JSON: %v", err)
	}

	if len(projects) != 2 {
		t.Fatalf("esperava 2 projetos, obteve %d", len(projects))
	}
}

func TestGetProjects_FilterByCategory(t *testing.T) {
	_, handler := setupTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/projects?category=Investimentos", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	var projects []domain.Project
	if err := json.NewDecoder(w.Body).Decode(&projects); err != nil {
		t.Fatalf("falha ao decodificar JSON: %v", err)
	}

	if len(projects) != 1 {
		t.Fatalf("esperava 1 projeto, obteve %d", len(projects))
	}
	if projects[0].Slug != "site-de-investimentos" {
		t.Errorf("projeto esperado 'site-de-investimentos', obteve '%s'", projects[0].Slug)
	}
}

func TestGetProjectBySlug_Found(t *testing.T) {
	_, handler := setupTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/projects/site-de-investimentos", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperava status 200, obteve %d", w.Code)
	}

	var project domain.Project
	if err := json.NewDecoder(w.Body).Decode(&project); err != nil {
		t.Fatalf("falha ao decodificar JSON: %v", err)
	}

	if project.Title != "Site de Investimentos" {
		t.Errorf("esperava 'Site de Investimentos', obteve '%s'", project.Title)
	}
}

func TestGetProjectBySlug_NotFound(t *testing.T) {
	_, handler := setupTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/projects/slug-inexistente", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("esperava status 404, obteve %d", w.Code)
	}
}

func TestIncrementProjectViews(t *testing.T) {
	_, handler := setupTestServer(t)

	req := httptest.NewRequest(http.MethodPost, "/api/projects/site-de-investimentos/view", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperava status 200, obteve %d", w.Code)
	}

	var res map[string]int64
	if err := json.NewDecoder(w.Body).Decode(&res); err != nil {
		t.Fatalf("falha ao decodificar JSON: %v", err)
	}

	if res["views"] != 1 {
		t.Errorf("esperava views 1, obteve %d", res["views"])
	}
}

func TestCreateContactMessage_Success(t *testing.T) {
	_, handler := setupTestServer(t)

	payload := map[string]string{
		"name":    "Pedro Dev",
		"email":   "pedro@empresa.com",
		"subject": "Parceria",
		"message": "Parabéns pelo leitor de mangá! Queremos bater um papo.",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/contact", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("esperava status 201 Created, obteve %d (body: %s)", w.Code, w.Body.String())
	}
}

func TestCreateContactMessage_InvalidData(t *testing.T) {
	_, handler := setupTestServer(t)

	payload := map[string]string{
		"name":    "",
		"email":   "email-invalido",
		"message": "curto",
	}
	body, _ := json.Marshal(payload)

	req := httptest.NewRequest(http.MethodPost, "/api/contact", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("esperava status 400 Bad Request, obteve %d", w.Code)
	}
}

func TestGetStats(t *testing.T) {
	_, handler := setupTestServer(t)

	req := httptest.NewRequest(http.MethodGet, "/api/stats", nil)
	w := httptest.NewRecorder()

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperava status 200, obteve %d", w.Code)
	}

	var stats domain.Stats
	if err := json.NewDecoder(w.Body).Decode(&stats); err != nil {
		t.Fatalf("falha ao decodificar JSON: %v", err)
	}

	if stats.TotalProjects != 2 {
		t.Errorf("esperava 2 projetos em stats, obteve %d", stats.TotalProjects)
	}
}
