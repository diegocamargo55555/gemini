.PHONY: all build build-frontend build-backend test run clean docker-build docker-up

all: build

build-frontend:
	cd frontend && npm install && npm run build

build-backend:
	go build -o bin/server cmd/server/main.go

build: build-frontend build-backend

test:
	go test -v ./...

run: build
	./bin/server

dev-backend:
	go run cmd/server/main.go

dev-frontend:
	cd frontend && npm run dev

docker-build:
	docker build -t manga-reader:latest .

docker-up:
	docker compose up -d --build

clean:
	rm -rf bin/ data/ frontend/dist
