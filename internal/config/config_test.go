package config_test

import (
	"os"
	"testing"

	"portfolio/internal/config"
)

func TestLoadConfig_Defaults(t *testing.T) {
	os.Clearenv()

	cfg := config.Load()

	if cfg.Port != "8080" {
		t.Errorf("esperava porta padrão 8080, obteve %s", cfg.Port)
	}
	if cfg.ProjectsFilePath != "data/projects.yaml" {
		t.Errorf("esperava caminho padrão data/projects.yaml, obteve %s", cfg.ProjectsFilePath)
	}
	if !cfg.EnableHotReload {
		t.Errorf("esperava hot-reload ativado por padrão")
	}
}

func TestLoadConfig_FromEnv(t *testing.T) {
	os.Setenv("PORT", "3000")
	os.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/portfolio")
	os.Setenv("PROJECTS_FILE", "/custom/projects.yaml")
	os.Setenv("ENABLE_HOT_RELOAD", "false")
	defer os.Clearenv()

	cfg := config.Load()

	if cfg.Port != "3000" {
		t.Errorf("esperava porta 3000, obteve %s", cfg.Port)
	}
	if cfg.DatabaseURL != "postgres://user:pass@localhost:5432/portfolio" {
		t.Errorf("DATABASE_URL não configurada corretamente")
	}
	if cfg.ProjectsFilePath != "/custom/projects.yaml" {
		t.Errorf("PROJECTS_FILE não configurado corretamente")
	}
	if cfg.EnableHotReload {
		t.Errorf("esperava hot-reload desativado via env")
	}
}
