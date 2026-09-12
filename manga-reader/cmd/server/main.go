package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"manga-reader/internal/api"
	"manga-reader/internal/config"
	"manga-reader/internal/mangadex"
	"manga-reader/internal/repository"
)

func main() {
	cfg := config.Load()

	log.Printf("Starting Manga Reader Server...")
	log.Printf("Port: %s | Database: %s | Static: %s", cfg.Port, cfg.DBPath, cfg.StaticDir)

	repo, err := repository.NewSQLiteRepository(cfg.DBPath)
	if err != nil {
		log.Fatalf("Fatal: failed to initialize repository: %v", err)
	}
	defer repo.Close()

	mdClient := mangadex.NewClient()
	handler := api.NewHandler(repo, mdClient)
	router := api.SetupRouter(handler, cfg.StaticDir)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown channel
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Manga Reader server listening on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-stop
	log.Printf("Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}

	log.Printf("Server stopped successfully.")
}
