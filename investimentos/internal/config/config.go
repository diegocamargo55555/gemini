package config

import (
	"os"
)

type Config struct {
	Port        string
	DBPath      string
	DatabaseURL string
	BrapiToken  string
	StaticDir   string
	Env         string
}

func Load() *Config {
	port := getEnv("PORT", "8084")
	dbPath := getEnv("DB_PATH", "data/investimentos.db")
	dbURL := os.Getenv("DATABASE_URL")
	brapiToken := os.Getenv("BRAPI_TOKEN")
	staticDir := getEnv("STATIC_DIR", "frontend/dist")
	env := getEnv("APP_ENV", "development")

	return &Config{
		Port:        port,
		DBPath:      dbPath,
		DatabaseURL: dbURL,
		BrapiToken:  brapiToken,
		StaticDir:   staticDir,
		Env:         env,
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
