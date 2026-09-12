# Estágio 1: Build do Frontend React
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --prefer-offline
COPY frontend/ ./
RUN npm run build

# Estágio 2: Build do Backend Go
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server cmd/server/main.go

# Estágio 3: Container Final Mínimo
FROM alpine:3.20
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata
RUN adduser -D -u 1000 appuser

COPY --from=backend-builder /app/server /app/server
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

RUN mkdir -p /app/data && chown -R appuser:appuser /app
USER appuser

ENV PORT=8084
ENV DB_PATH=/app/data/investimentos.db
ENV STATIC_DIR=/app/frontend/dist
ENV GIN_MODE=release

EXPOSE 8084

CMD ["/app/server"]
