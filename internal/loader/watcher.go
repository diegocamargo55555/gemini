package loader

import (
	"context"
	"fmt"
	"log"
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
	"portfolio/internal/domain"
)

type ReloadCallback func(projects []domain.Project)

type Watcher struct {
	filePath string
	callback ReloadCallback
	watcher  *fsnotify.Watcher
	mu       sync.Mutex
	closed   bool
}

// NewWatcher inicializa o monitor de alterações de arquivo
func NewWatcher(filePath string, callback ReloadCallback) (*Watcher, error) {
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		return nil, fmt.Errorf("caminho inválido: %w", err)
	}

	w, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, fmt.Errorf("falha ao inicializar fsnotify: %w", err)
	}

	// Observa o diretório pai para capturar recriações/renomeações atômicas de editores
	parentDir := filepath.Dir(absPath)
	if err := w.Add(parentDir); err != nil {
		w.Close()
		return nil, fmt.Errorf("falha ao observar diretório %s: %w", parentDir, err)
	}

	return &Watcher{
		filePath: absPath,
		callback: callback,
		watcher:  w,
	}, nil
}

// Start inicia o loop de monitoramento de eventos de arquivo
func (w *Watcher) Start(ctx context.Context) {
	var debounceTimer *time.Timer
	debounceDuration := 150 * time.Millisecond

	for {
		select {
		case <-ctx.Done():
			return

		case event, ok := <-w.watcher.Events:
			if !ok {
				return
			}

			// Verifica se o evento corresponde ao nosso arquivo de projetos
			eventAbsPath, err := filepath.Abs(event.Name)
			if err != nil || eventAbsPath != w.filePath {
				continue
			}

			// Apenas eventos de escrita, criação ou renomeação
			if event.Has(fsnotify.Write) || event.Has(fsnotify.Create) || event.Has(fsnotify.Rename) {
				if debounceTimer != nil {
					debounceTimer.Stop()
				}
				debounceTimer = time.AfterFunc(debounceDuration, func() {
					projects, err := LoadProjectsFromFile(w.filePath)
					if err != nil {
						log.Printf("[Watcher] Erro ao recarregar projetos: %v", err)
						return
					}
					log.Printf("[Watcher] Projetos recarregados com sucesso (%d projetos)", len(projects))
					if w.callback != nil {
						w.callback(projects)
					}
				})
			}

		case err, ok := <-w.watcher.Errors:
			if !ok {
				return
			}
			log.Printf("[Watcher] Erro no fsnotify: %v", err)
		}
	}
}

// Close finaliza o watcher
func (w *Watcher) Close() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.closed {
		return nil
	}
	w.closed = true
	return w.watcher.Close()
}
