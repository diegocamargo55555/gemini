package config

import (
	"os"
)

type Config struct {
	Port      string
	DBPath    string
	StaticDir string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8085"
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "data/manga.db"
	}

	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = "frontend/dist"
	}

	return &Config{
		Port:      port,
		DBPath:    dbPath,
		StaticDir: staticDir,
	}
}
