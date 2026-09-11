package memory_test

import (
	"context"
	"testing"

	"portfolio/internal/domain"
	"portfolio/internal/repository/memory"
)

func TestMemoryRepository_ProjectsFlow(t *testing.T) {
	repo := memory.NewMemoryRepository()
	ctx := context.Background()

	projects := []domain.Project{
		{
			ID:               "proj-1",
			Title:            "Site de Investimentos",
			Slug:             "site-de-investimentos",
			ShortDescription: "Dashboard financeiro",
			Category:         "Investimentos",
			Tags:             []string{"Go", "React"},
			Order:            1,
		},
		{
			ID:               "proj-2",
			Title:            "Leitor de Manga",
			Slug:             "leitor-de-manga",
			ShortDescription: "Catálogo de quadrinhos",
			Category:         "Manga",
			Tags:             []string{"React", "Docker"},
			Order:            2,
		},
	}

	// 1. Sync
	if err := repo.SyncProjects(ctx, projects); err != nil {
		t.Fatalf("falha ao sincronizar: %v", err)
	}

	// 2. Get All
	all, err := repo.GetAllProjects(ctx, "", "")
	if err != nil || len(all) != 2 {
		t.Fatalf("esperava 2 projetos, obteve %d (err: %v)", len(all), err)
	}

	// 3. Filter by Category
	invOnly, err := repo.GetAllProjects(ctx, "Investimentos", "")
	if err != nil || len(invOnly) != 1 {
		t.Fatalf("esperava 1 projeto na categoria Investimentos, obteve %d", len(invOnly))
	}
	if invOnly[0].Slug != "site-de-investimentos" {
		t.Errorf("projeto incorreto retornado: %s", invOnly[0].Slug)
	}

	// 4. Filter by Tag
	reactOnly, err := repo.GetAllProjects(ctx, "", "React")
	if err != nil || len(reactOnly) != 2 {
		t.Fatalf("esperava 2 projetos com tag React, obteve %d", len(reactOnly))
	}

	// 5. Get By Slug
	p, err := repo.GetProjectBySlug(ctx, "site-de-investimentos")
	if err != nil || p == nil {
		t.Fatalf("esperava encontrar projeto, obteve err: %v", err)
	}

	_, err = repo.GetProjectBySlug(ctx, "slug-inexistente")
	if err != domain.ErrProjectNotFound {
		t.Fatalf("esperava ErrProjectNotFound, obteve: %v", err)
	}

	// 6. Views Increment
	views, err := repo.IncrementProjectViews(ctx, "site-de-investimentos")
	if err != nil || views != 1 {
		t.Fatalf("esperava 1 view, obteve %d (err: %v)", views, err)
	}

	views, err = repo.IncrementProjectViews(ctx, "site-de-investimentos")
	if err != nil || views != 2 {
		t.Fatalf("esperava 2 views, obteve %d (err: %v)", views, err)
	}

	// Sync again shouldn't wipe view count
	if err := repo.SyncProjects(ctx, projects); err != nil {
		t.Fatalf("falha ao resincronizar: %v", err)
	}
	pUpdated, err := repo.GetProjectBySlug(ctx, "site-de-investimentos")
	if err != nil || pUpdated.Views != 2 {
		t.Fatalf("esperava preservar 2 views após sync, obteve %d", pUpdated.Views)
	}
}

func TestMemoryRepository_ContactAndStats(t *testing.T) {
	repo := memory.NewMemoryRepository()
	ctx := context.Background()

	msg := &domain.ContactMessage{
		Name:    "Carlos",
		Email:   "carlos@teste.com",
		Subject: "Oportunidade",
		Message: "Gostei muito do projeto de investimentos!",
	}

	if err := repo.SaveContactMessage(ctx, msg); err != nil {
		t.Fatalf("falha ao salvar mensagem de contato: %v", err)
	}

	messages, err := repo.GetContactMessages(ctx)
	if err != nil || len(messages) != 1 {
		t.Fatalf("esperava 1 mensagem, obteve %d (err: %v)", len(messages), err)
	}

	stats, err := repo.GetStats(ctx)
	if err != nil {
		t.Fatalf("falha ao obter estatísticas: %v", err)
	}
	if stats.TotalMessages != 1 {
		t.Errorf("esperava 1 total message, obteve %d", stats.TotalMessages)
	}
}
