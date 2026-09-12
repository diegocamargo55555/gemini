.PHONY: all build run test clean docker-build docker-up frontend-build backend-build

all: build

frontend-build:
	@echo "📦 Compilando Frontend (React + Vite + TailwindCSS)..."
	cd frontend && npm install && npm run build

backend-build:
	@echo "🔨 Compilando Backend Go (Gin + GORM)..."
	go mod tidy
	go build -o bin/server cmd/server/main.go

build: frontend-build backend-build
	@echo "✅ Build completo gerado com sucesso em bin/server e frontend/dist"

run:
	@echo "🚀 Iniciando Plataforma de Investimentos na porta 8084..."
	PORT=8084 ./bin/server

test:
	@echo "🧪 Executando testes unitários e de integração..."
	go test -v ./...

docker-build:
	@echo "🐳 Construindo imagem Docker..."
	docker compose build

docker-up:
	@echo "🐳 Iniciando container via Docker Compose..."
	docker compose up -d

clean:
	@echo "🧹 Limpando artefatos de build..."
	rm -rf bin/ frontend/dist
