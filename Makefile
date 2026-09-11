.PHONY: test test-backend test-frontend build-frontend build run docker-build docker-up docker-down clean

# Executa todos os testes (Backend Go + Frontend React)
test: test-backend test-frontend

# Executa os testes unitários e de integração em Go
test-backend:
	@echo "==> Executando testes do Backend (Go)..."
	go test -v ./...

# Executa os testes do React com Vitest e Testing Library
test-frontend:
	@echo "==> Executando testes do Frontend (Vitest)..."
	cd frontend && npm test

# Compila o frontend React com Vite
build-frontend:
	@echo "==> Compilando frontend..."
	cd frontend && npm run build

# Compila a aplicação completa (Frontend + Binário Go)
build: build-frontend
	@echo "==> Compilando binário do servidor..."
	go build -ldflags="-s -w" -o bin/portfolio-server ./cmd/server

# Executa localmente com os estáticos compilados
run: build
	@echo "==> Iniciando aplicação na porta 8080..."
	STATIC_DIR=frontend/dist ./bin/portfolio-server

# Build da imagem Docker
docker-build:
	@echo "==> Construindo imagem Docker multi-stage..."
	docker compose build

# Sobe os containers (App + PostgreSQL) em segundo plano
docker-up:
	@echo "==> Subindo containers com Docker Compose..."
	docker compose up -d

# Para os containers
docker-down:
	@echo "==> Parando containers..."
	docker compose down

# Limpeza de artefatos
clean:
	@echo "==> Limpando builds temporários..."
	rm -rf bin frontend/dist
