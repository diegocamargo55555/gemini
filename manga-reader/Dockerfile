# Stage 1: Build Frontend (React + Vite + TailwindCSS)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend (Go + modernc SQLite)
FROM golang:1.24-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/server cmd/server/main.go

# Stage 3: Minimal Production Runtime
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=backend-builder /app/bin/server /app/server
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data
USER appuser

ENV PORT=8080
ENV DB_PATH=/app/data/manga.db
ENV STATIC_DIR=/app/frontend/dist

EXPOSE 8080

VOLUME ["/app/data"]

CMD ["/app/server"]
