# ==========================================
# Etapa 1: Build do Frontend React
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Etapa 2: Build do Backend Golang
# ==========================================
FROM golang:alpine AS backend-builder
WORKDIR /app

# Instala certificados CA e dependências de build
RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY internal/ ./internal/
COPY cmd/ ./cmd/

# Compilação estática com remoção de símbolos de debug (-s -w) para menor consumo e tamanho
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o portfolio-server ./cmd/server

# ==========================================
# Etapa 3: Imagem Final de Execução (Ultra-leve)
# ==========================================
FROM alpine:3.20
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

# Cria usuário não-root para máxima segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copia o binário compilado
COPY --from=backend-builder /app/portfolio-server /app/portfolio-server

# Copia os assets estáticos do React compilado
COPY --from=frontend-builder /app/frontend/dist /app/public

# Diretório para dados com permissões adequadas
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENV PORT=8080
ENV STATIC_DIR=/app/public
ENV PROJECTS_FILE=/app/data/projects.yaml
ENV ENABLE_HOT_RELOAD=true

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

ENTRYPOINT ["/app/portfolio-server"]
