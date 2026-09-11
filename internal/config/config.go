package config

import (
	"os"
	"strings"
)

type Config struct {
	Port             string
	DatabaseURL      string
	ProjectsFilePath string
	StaticDir        string
	EnableHotReload  bool
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")

	projectsFile := os.Getenv("PROJECTS_FILE")
	if projectsFile == "" {
		projectsFile = "data/projects.yaml"
	}

	staticDir := os.Getenv("STATIC_DIR")

	hotReloadStr := strings.ToLower(os.Getenv("ENABLE_HOT_RELOAD"))
	enableHotReload := true
	if hotReloadStr == "false" || hotReloadStr == "0" || hotReloadStr == "no" {
		enableHotReload = false
	}

	return &Config{
		Port:             port,
		DatabaseURL:      dbURL,
		ProjectsFilePath: projectsFile,
		StaticDir:        staticDir,
		EnableHotReload:  enableHotReload,
	}
}
