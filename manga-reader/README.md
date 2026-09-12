# 📖 MangaDex Reader & Biblioteca de Mangás

Aplicação web moderna e de alta performance para explorar o catálogo completo do **MangaDex**, ler capítulos com leitor integrado de alta velocidade e gerenciar sua biblioteca pessoal de mangás organizada em categorias (**Lendo**, **Pretendo Ler**, **Concluído**, **Dropado**).

Construído com **Golang (Go 1.22+)**, **React 19**, **TypeScript**, **TailwindCSS**, **SQLite** e arquitetura de cache em memória para evitar rate limits.

---

## 🌟 Funcionalidades Principais

1. **Catálogo Completo MangaDex**:
   - Busca em tempo real de dezenas de milhares de títulos.
   - Ordenação dinâmica por: *Mais Seguidos (Popularidade)*, *Últimos Capítulos Lançados*, *Relevância de Busca* e *Ordem Alfabética*.
   - Filtros por gêneros e temas oficiais (Ação, Comédia, Romance, Fantasia, Isekai, etc.).
   - Capas em alta resolução com pré-carregamento e fallback automático.

2. **Gerenciamento de Biblioteca com Categorias**:
   - Salve mangás nas 4 categorias principais:
     - 🟢 **Lendo (Reading)**: Mangás em acompanhamento ativo.
     - 🔵 **Pretendo Ler (Plan to Read)**: Lista de desejos para leitura futura.
     - 🟣 **Concluído (Finished)**: Obras finalizadas.
     - 🔴 **Dropado (Dropped)**: Obras abandonadas ou pausadas.
   - Painel da Biblioteca com contadores em tempo real, abas por categoria e busca interna.
   - Sistema de avaliação pessoal (notas de 1 a 10) e anotações privadas por mangá.

3. **Leitura e Histórico de Capítulos**:
   - Lista completa de capítulos com suporte a múltiplos idiomas (**PT-BR** e **EN**).
   - Ordenação crescente ou decrescente de capítulos.
   - Marcador automático de capítulos já lidos.
   - Botão de acesso rápido *"Continuar Leitura"* na obra que você está lendo.

4. **Leitor Integrado de Alto Desempenho**:
   - Visualização fluida das páginas diretamente via servidores MangaDex At-Home.
   - **Modo Cascata Contínua (Webtoon)**: Rolagem vertical suave ideal para leitura moderna.
   - **Modo Página por Página**: Navegação clássica com botões e atalhos de teclado (Setas Esquerda/Direita).
   - **Data Saver (Econômico)**: Alternância para imagens comprimidas para economia de dados.
   - Navegação direta entre capítulos anterior e próximo sem sair do leitor.
   - Sincronização automática de progresso com o banco de dados.

5. **Backend Leve e Eficiente (Golang)**:
   - Proxy com cache inteligente TTL em memória para contornar limitações de taxa (rate limits) da API do MangaDex.
   - Persistência com **SQLite** em modo WAL (Write-Ahead Logging) para escrita concorrente sem dependências pesadas de banco externo.
   - Servidor HTTP nativo de arquivo estático Go para servir o SPA compilado em uma única porta unificada.

---

## 🏗️ Estrutura do Projeto

```text
manga-reader/
├── cmd/
│   └── server/
│       └── main.go                 # Entrypoint Go, servidor HTTP e roteamento SPA
├── internal/
│   ├── api/                        # Handlers REST, middlewares (CORS, Logging, Recovery) e rotas
│   │   ├── handlers.go
│   │   ├── handlers_test.go
│   │   ├── middleware.go
│   │   └── routes.go
│   ├── config/                     # Carregador de variáveis de ambiente
│   │   └── config.go
│   ├── domain/                     # Modelos de domínio (Manga, Chapter, Library, Status)
│   │   ├── manga.go
│   │   └── library.go
│   ├── mangadex/                   # Cliente oficial MangaDex com cache de memória TTL
│   │   ├── cache.go
│   │   ├── client.go
│   │   └── client_test.go
│   └── repository/                 # Repositório SQLite para a biblioteca do usuário
│       ├── repository.go
│       ├── sqlite.go
│       └── sqlite_test.go
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, MangaCard, StatusModal, ChapterList, Reader, CategoryBadge
│   │   ├── pages/                  # HomePage, MangaDetailPage, LibraryPage
│   │   ├── services/               # Cliente HTTP da API Go
│   │   ├── types/                  # Tipagens TypeScript
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── Dockerfile                      # Multi-stage build (Node -> Go -> Alpine ~25MB)
├── docker-compose.yml              # Orquestração com limite de recursos e persistência
├── Makefile                        # Comandos de automação (build, test, run, docker)
├── .env.example
└── README.md
```

---

## ⚡ Guia de Início Rápido

### Pré-requisitos
- **Go**: >= 1.22
- **Node.js**: >= 18 e **npm**
- *(Opcional)* **Docker** e **Docker Compose**

### 1. Rodando com Docker Compose (Mais rápido)

```bash
cd manga-reader
docker compose up -d --build
```
Acesse no navegador: **`http://localhost:8080`**

### 2. Rodando Localmente (Binário Unificado)

```bash
cd manga-reader

# 1. Compilar frontend e backend
make build

# 2. Executar o servidor
make run
```
Acesse no navegador: **`http://localhost:8080`**

### 3. Rodando em Modo de Desenvolvimento (Hot-Reload)

Abra dois terminais:

**Terminal 1 (Backend Go):**
```bash
cd manga-reader
go run cmd/server/main.go
```

**Terminal 2 (Frontend Vite):**
```bash
cd manga-reader/frontend
npm run dev
```
Acesse no navegador: **`http://localhost:5173`** (as chamadas `/api/*` são roteadas automaticamente para o backend na porta 8080).

---

## 🧪 Executando os Testes Automatizados

O backend possui testes unitários e de integração completos:

```bash
cd manga-reader
go test -v ./...
```

---

## 🔌 Endpoints da API REST

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/health` | Status de saúde da aplicação |
| `GET` | `/api/manga?q=...&tags=...&order=...` | Busca e listagem de mangás do MangaDex |
| `GET` | `/api/manga/{id}` | Detalhes de um mangá específico |
| `GET` | `/api/manga/{id}/chapters?lang=pt-br,en` | Lista de capítulos com filtro por idioma |
| `GET` | `/api/chapters/{chapterId}/pages` | URLs das páginas do leitor via MangaDex @Home |
| `GET` | `/api/tags` | Lista de gêneros e tags para filtros |
| `GET` | `/api/library` | Lista de mangás salvos na biblioteca (filtro opcional: `?status=...`) |
| `GET` | `/api/library/stats` | Contagem de mangás por categoria |
| `GET` | `/api/library/{mangaId}` | Consulta o status de um mangá específico |
| `POST` | `/api/library` | Adiciona ou atualiza categoria, nota ou anotações de um mangá |
| `DELETE` | `/api/library/{mangaId}` | Remove o mangá da biblioteca |
| `PUT` | `/api/library/{mangaId}/progress` | Atualiza o último capítulo lido pelo usuário |
