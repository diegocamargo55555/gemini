package loader_test

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"

	"portfolio/internal/domain"
	"portfolio/internal/loader"
)

func TestFileWatcher_ReloadsOnModification(t *testing.T) {
	tmpDir := t.TempDir()
	filePath := filepath.Join(tmpDir, "projects.yaml")

	initialContent := `
projects:
  - id: "proj-initial"
    title: "Projeto Inicial"
    category: "Geral"
`
	if err := os.WriteFile(filePath, []byte(initialContent), 0644); err != nil {
		t.Fatalf("falha ao criar arquivo: %v", err)
	}

	reloadCh := make(chan []domain.Project, 5)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	watcher, err := loader.NewWatcher(filePath, func(projects []domain.Project) {
		reloadCh <- projects
	})
	if err != nil {
		t.Fatalf("falha ao criar watcher: %v", err)
	}
	defer watcher.Close()

	go watcher.Start(ctx)

	// Pequena pausa para o watcher iniciar
	time.Sleep(50 * time.Millisecond)

	updatedContent := `
projects:
  - id: "proj-modificado"
    title: "Projeto Modificado"
    category: "Investimentos"
  - id: "manga-modificado"
    title: "Manga Modificado"
    category: "Mangás"
`
	if err := os.WriteFile(filePath, []byte(updatedContent), 0644); err != nil {
		t.Fatalf("falha ao atualizar arquivo: %v", err)
	}

	select {
	case projects := <-reloadCh:
		if len(projects) != 2 {
			t.Fatalf("esperava 2 projetos recarregados, obteve %d", len(projects))
		}
		if projects[0].Title != "Projeto Modificado" {
			t.Errorf("esperava 'Projeto Modificado', obteve '%s'", projects[0].Title)
		}
	case <-time.After(2 * time.Second):
		t.Fatalf("timeout aguardando notificação de reload")
	}
}
