package main

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"portfolio/internal/api"
	"portfolio/internal/config"
	"portfolio/internal/domain"
	"portfolio/internal/loader"
	"portfolio/internal/repository"
	"portfolio/internal/repository/memory"
	"portfolio/internal/repository/postgres"
)

func main() {
	cfg := config.Load()
	log.Printf("[Portfolio] Iniciando servidor na porta %s...", cfg.Port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. Inicializa o Repositório (PostgreSQL se configurado, ou Memória como fallback)
	var repo repository.Repository
	if cfg.DatabaseURL != "" {
		log.Printf("[Portfolio] Conectando ao banco PostgreSQL...")
		pgRepo, err := postgres.NewPostgresRepository(ctx, cfg.DatabaseURL)
		if err != nil {
			log.Printf("[Portfolio] AVISO: Falha ao conectar ao PostgreSQL (%v). Utilizando repositório em memória.", err)
			repo = memory.NewMemoryRepository()
		} else {
			log.Printf("[Portfolio] Conexão com PostgreSQL estabelecida e migrações aplicadas com sucesso.")
			repo = pgRepo
		}
	} else {
		log.Printf("[Portfolio] Nenhuma DATABASE_URL definida. Utilizando repositório em memória.")
		repo = memory.NewMemoryRepository()
	}
	defer repo.Close()

	// 2. Carga inicial dos projetos a partir do arquivo YAML
	projects, err := loader.LoadProjectsFromFile(cfg.ProjectsFilePath)
	if err != nil {
		log.Printf("[Portfolio] AVISO: Não foi possível carregar %s: %v", cfg.ProjectsFilePath, err)
	} else {
		if err := repo.SyncProjects(ctx, projects); err != nil {
			log.Printf("[Portfolio] Erro ao sincronizar projetos: %v", err)
		} else {
			log.Printf("[Portfolio] %d projetos sincronizados com sucesso a partir de %s", len(projects), cfg.ProjectsFilePath)
		}
	}

	// 3. Monitoramento de alterações (Hot-Reload)
	if cfg.EnableHotReload {
		watcher, err := loader.NewWatcher(cfg.ProjectsFilePath, func(reloadedProjects []domain.Project) {
			if err := repo.SyncProjects(context.Background(), reloadedProjects); err != nil {
				log.Printf("[Portfolio] Falha ao sincronizar projetos recarregados: %v", err)
			} else {
				log.Printf("[Portfolio] Sincronização automática concluída (%d projetos)", len(reloadedProjects))
			}
		})
		if err != nil {
			log.Printf("[Portfolio] Não foi possível iniciar watcher de arquivo: %v", err)
		} else {
			defer watcher.Close()
			go watcher.Start(ctx)
			log.Printf("[Portfolio] Hot-reload ativado monitorando: %s", cfg.ProjectsFilePath)
		}
	}

	// 4. Configuração das Rotas (API + SPA Estático)
	apiHandler := api.NewRouter(repo)

	mainMux := http.NewServeMux()
	mainMux.Handle("/api/", apiHandler)

	// Servir estáticos do frontend (Vite SPA)
	setupStaticFiles(mainMux, cfg.StaticDir)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      api.LoggingMiddleware(mainMux),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 5. Graceful Shutdown
	stopCh := make(chan os.Signal, 1)
	signal.Notify(stopCh, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("[Portfolio] Servidor pronto e escutando em http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("[Portfolio] Erro fatal no servidor HTTP: %v", err)
		}
	}()

	<-stopCh
	log.Println("[Portfolio] Encerrando servidor graciosamente...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("[Portfolio] Erro ao desligar servidor: %v", err)
	}
	log.Println("[Portfolio] Servidor encerrado.")
}

// setupStaticFiles configura o servidor para arquivos do frontend SPA
func setupStaticFiles(mux *http.ServeMux, staticDir string) {
	if staticDir == "" {
		// Tenta caminhos padrões se existirem
		candidates := []string{"frontend/dist", "dist", "public"}
		for _, c := range candidates {
			if info, err := os.Stat(c); err == nil && info.IsDir() {
				staticDir = c
				break
			}
		}
	}

	if staticDir == "" {
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api") {
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			fmt.Fprintf(w, `<!DOCTYPE html>
<html>
<head><title>Portfolio API</title></head>
<body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc;">
	<h1>Portfolio API está ativa!</h1>
	<p>Consulte os endpoints em: <a href="/api/projects" style="color: #38bdf8;">/api/projects</a>, <a href="/api/stats" style="color: #38bdf8;">/api/stats</a> e <a href="/api/health" style="color: #38bdf8;">/api/health</a>.</p>
	<p>O frontend React pode ser compilado em <code>frontend/dist</code> para ser servido nesta mesma porta.</p>
</body>
</html>`)
		})
		return
	}

	absStaticDir, err := filepath.Abs(staticDir)
	if err != nil {
		log.Printf("[Portfolio] Caminho estático inválido: %v", err)
		return
	}

	fileSystem := os.DirFS(absStaticDir)
	fileServer := http.FileServer(http.FS(fileSystem))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api") {
			return
		}

		cleanPath := strings.TrimPrefix(filepath.Clean(r.URL.Path), "/")
		if cleanPath == "" {
			cleanPath = "index.html"
		}

		// Se o arquivo solicitado existe fisicamente, serve-o
		if _, err := fs.Stat(fileSystem, cleanPath); err == nil {
			fileServer.ServeHTTP(w, r)
			return
		}

		// Fallback para index.html (suporte a rotas do React SPA)
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})

	log.Printf("[Portfolio] Servindo frontend SPA a partir de: %s", absStaticDir)
}
