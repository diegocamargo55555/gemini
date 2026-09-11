package loader_test

import (
	"os"
	"path/filepath"
	"testing"

	"portfolio/internal/loader"
)

func TestLoadProjectsFromYAML_Success(t *testing.T) {
	yamlContent := `
projects:
  - id: "investimentos-app"
    title: "Plataforma de Investimentos"
    slug: "investimentos-app"
    short_description: "Dashboard de investimentos e análise de ativos em tempo real"
    description: "Sistema completo para rastreamento de carteira de ações, FIIs e renda fixa com gráficos interativos e cotações."
    category: "Fintech & Investimentos"
    tags:
      - "Golang"
      - "React"
      - "PostgreSQL"
      - "Docker"
    cover_image: "/images/investimentos-cover.png"
    demo_url: "https://investimentos.demo.com"
    github_url: "https://github.com/usuario/investimentos"
    status: "completed"
    featured: true
    order: 1
    metrics:
      users: "1.2k+"
      uptime: "99.9%"
  - id: "manga-reader"
    title: "Leitor de Mangá Online"
    slug: "manga-reader"
    short_description: "Leitor moderno de mangás com suporte offline e modo leitura otimizado"
    description: "Aplicação web de alta performance para leitura de mangás e quadrinhos com cache inteligente e catálogo categorizado."
    category: "Entretenimento & Mangá"
    tags:
      - "React"
      - "Golang"
      - "Docker"
    cover_image: "/images/manga-cover.png"
    demo_url: "https://manga.demo.com"
    github_url: "https://github.com/usuario/manga-reader"
    status: "in-progress"
    featured: true
    order: 2
`
	tmpDir := t.TempDir()
	filePath := filepath.Join(tmpDir, "projects.yaml")
	if err := os.WriteFile(filePath, []byte(yamlContent), 0644); err != nil {
		t.Fatalf("falha ao criar arquivo de teste: %v", err)
	}

	projects, err := loader.LoadProjectsFromFile(filePath)
	if err != nil {
		t.Fatalf("erro inesperado ao carregar projetos: %v", err)
	}

	if len(projects) != 2 {
		t.Fatalf("esperava 2 projetos, obteve %d", len(projects))
	}

	p1 := projects[0]
	if p1.Title != "Plataforma de Investimentos" {
		t.Errorf("esperava título 'Plataforma de Investimentos', obteve '%s'", p1.Title)
	}
	if p1.Category != "Fintech & Investimentos" {
		t.Errorf("esperava categoria 'Fintech & Investimentos', obteve '%s'", p1.Category)
	}
	if len(p1.Tags) != 4 {
		t.Errorf("esperava 4 tags, obteve %d", len(p1.Tags))
	}
	if !p1.Featured {
		t.Errorf("esperava que o projeto 1 fosse featured")
	}

	p2 := projects[1]
	if p2.Slug != "manga-reader" {
		t.Errorf("esperava slug 'manga-reader', obteve '%s'", p2.Slug)
	}
}

func TestLoadProjectsFromYAML_AutoSlug(t *testing.T) {
	yamlContent := `
projects:
  - id: "proj-1"
    title: "Meu Site de Cripto & Ações"
    short_description: "Breve descrição"
    category: "Investimentos"
`
	tmpDir := t.TempDir()
	filePath := filepath.Join(tmpDir, "projects.yaml")
	if err := os.WriteFile(filePath, []byte(yamlContent), 0644); err != nil {
		t.Fatalf("falha ao criar arquivo: %v", err)
	}

	projects, err := loader.LoadProjectsFromFile(filePath)
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if len(projects) != 1 {
		t.Fatalf("esperava 1 projeto, obteve %d", len(projects))
	}

	if projects[0].Slug != "meu-site-de-cripto-e-acoes" {
		t.Errorf("slug gerado incorreto: obteve '%s', esperava 'meu-site-de-cripto-e-acoes'", projects[0].Slug)
	}
}

func TestLoadProjectsFromYAML_ValidationMissingTitle(t *testing.T) {
	yamlContent := `
projects:
  - id: "invalid-proj"
    short_description: "Sem título"
`
	tmpDir := t.TempDir()
	filePath := filepath.Join(tmpDir, "projects.yaml")
	if err := os.WriteFile(filePath, []byte(yamlContent), 0644); err != nil {
		t.Fatalf("falha ao criar arquivo: %v", err)
	}

	_, err := loader.LoadProjectsFromFile(filePath)
	if err == nil {
		t.Fatalf("esperava erro de validação por falta de título, mas obteve nil")
	}
}

func TestLoadProjectsFromYAML_FileNotFound(t *testing.T) {
	_, err := loader.LoadProjectsFromFile("/caminho/inexistente/projects.yaml")
	if err == nil {
		t.Fatalf("esperava erro de arquivo não encontrado, mas obteve nil")
	}
}
