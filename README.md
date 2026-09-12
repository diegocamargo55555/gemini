# 🚀 DevPortfolio - Plataforma de Portfólio de Alta Performance

Um site de portfólio profissional de alto desempenho construído do zero com **Golang**, **React**, **Docker** e **PostgreSQL**, desenvolvido integralmente seguindo **Test-Driven Development (TDD)**.

Projetado especialmente para hospedar e demonstrar projetos como a **Plataforma de Investimentos**, o **Leitor de Mangás Online** e futuros sistemas, mantendo consumo de memória ínfimo (< 30 MB de RAM no container da aplicação) para coexistir com folga em um servidor VPS com **4 vCPUs e 8 GB de RAM**.

---

## 📋 Sumário
- [Arquitetura & Destaques](#-arquitetura--destaques)
- [Desenvolvimento Orientado a Testes (TDD)](#-desenvolvimento-orientado-a-testes-tdd)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Guia de Início Rápido](#-guia-de-início-rápido)
  - [Pré-requisitos](#pré-requisitos)
  - [Executando Testes](#executando-testes)
  - [Execução Local](#execução-local)
  - [Deploy com Docker Compose](#deploy-com-docker-compose)
- [Como Cadastrar Novos Projetos (YAML com Hot-Reload)](#-como-cadastrar-novos-projetos-yaml-com-hot-reload)
- [Dimensionamento de Recursos (Servidor 4 Cores / 8 GB RAM)](#-dimensionamento-de-recursos-servidor-4-cores--8-gb-ram)
- [Endpoints da API REST](#-endpoints-da-api-rest)

---

## 🏛️ Arquitetura & Destaques

1. **Fonte da Verdade em Arquivo YAML (`data/projects.yaml`)**:
   - Permite adicionar, editar ou ordenar projetos simplesmente alterando o arquivo, sem necessidade de recompilação ou reinicialização.
   - **Hot-Reload Automático com `fsnotify`**: O backend monitora eventos de escrita no arquivo com debounce inteligente e atualiza a memória e o PostgreSQL em tempo real.
2. **Backend em Golang**:
   - Roteamento nativo com o novo `http.ServeMux` do Go (`GET /api/projects/{slug}`, `POST /api/contact`, etc.) sem bibliotecas externas pesadas.
   - Sincronização e persistência no **PostgreSQL** (com migrações automáticas de schema na inicialização).
   - Fallback gracioso para repositório em memória caso o banco de dados esteja offline em desenvolvimento local.
3. **Frontend em React 18 + Vite + TailwindCSS**:
   - Interface dark mode ultra-moderna, responsiva e acessível.
   - Filtros instantâneos por categoria, busca textual em tempo real e visualização detalhada em modal.
   - Indicador de status em tempo real da API e telemetria de visualizações.
4. **Docker Multi-Stage Otimizado**:
   - Compilação do React e binário estático Go em estágios isolados.
   - Imagem final baseada em `alpine` rodando como usuário não-root (`appuser`), com peso de ~25 MB e consumo em runtime de ~15 MB de RAM.

---

## 🧪 Desenvolvimento Orientado a Testes (TDD)

Todo o código foi concebido sob o ciclo **Red-Green-Refactor**:

### 1. Testes do Backend (Go)
- `internal/loader/loader_test.go`: Validação de leitura YAML, sanitização, ordenação e geração automática de slugs amigáveis.
- `internal/loader/watcher_test.go`: Verificação do watcher de modificação de arquivo e disparo de callback de sincronização.
- `internal/domain/contact_test.go`: Validação estrita de e-mails, campos obrigatórios e comprimento mínimo de mensagens.
- `internal/repository/memory/memory_test.go`: Teste de integridade de upsert de projetos, incremento de visualizações e filtragem.
- `internal/api/handlers_test.go`: Testes de integração HTTP com `httptest.ResponseRecorder` para todos os endpoints (`GET /api/projects`, `GET /api/health`, `POST /api/contact`, `POST /api/projects/{slug}/view`, etc.).
- `internal/config/config_test.go`: Validação de carregamento por variáveis de ambiente com fallbacks padrão.

### 2. Testes do Frontend (React + Vitest + Testing Library)
- `ProjectCard.test.tsx`: Renderização de badges de destaque, categoria, métricas, tags e acionamento de eventos de seleção.
- `ProjectFilter.test.tsx`: Interação com filtros de categorias e eventos de digitação no campo de busca.
- `ContactForm.test.tsx`: Validações de formulário (campos em branco, e-mail inválido) e envio assíncrono.

---

## 📁 Estrutura do Projeto

```text
.
├── cmd/
│   └── server/
│       └── main.go                 # Entrypoint Go, servidor HTTP e roteamento SPA
├── internal/
│   ├── api/                        # Handlers HTTP, middlewares CORS/Logging e rotas
│   ├── config/                     # Leitura de variáveis de ambiente (.env)
│   ├── domain/                     # Modelos de domínio (Project, ContactMessage, Stats)
│   ├── loader/                     # Parser YAML e Watcher com Hot-Reload (fsnotify)
│   └── repository/                 # Interfaces, Repositório Memória e PostgreSQL (pgx)
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, Hero, ProjectCard, ProjectModal, ContactForm, etc.
│   │   ├── types/                  # Definições TypeScript
│   │   ├── App.tsx                 # Aplicação React principal
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── projects.yaml               # Arquivo fonte com os projetos (Investimentos, Mangá, etc.)
├── docker-compose.yml              # Orquestração do App + PostgreSQL com limites de CPU/RAM
├── Dockerfile                      # Multi-stage build (Node -> Go -> Alpine)
├── Makefile                        # Comandos automatizados de test, build e run
├── .env.example                    # Modelo de variáveis de ambiente
└── README.md
```

---

## ⚡ Guia de Início Rápido

### Pré-requisitos
- **Go**: >= 1.22
- **Node.js**: >= 18 e **npm**
- **Docker** e **Docker Compose**

### Executando Testes

Para rodar **todos** os testes (Backend Go + Frontend React) em uma única linha:
```bash
make test
```

Ou separadamente:
```bash
make test-backend    # Executa go test -v ./...
make test-frontend   # Executa os testes do React com Vitest
```

---

### Execução Local (Sem Docker)

1. Instale as dependências e compile o frontend:
```bash
make build
```

2. Inicie o servidor Go:
```bash
make run
```
Acesse no seu navegador: `http://localhost:8080`.

---

### Deploy com Docker Compose (Recomendado para Produção)

Para subir o Portfólio junto ao PostgreSQL com limites ajustados:

1. Configure as variáveis de ambiente (opcional, já há valores padrão seguros):
```bash
cp .env.example .env
```

2. Suba os containers:
```bash
make docker-up
```
Ou diretamente com Docker:
```bash
docker compose up -d --build
```

3. Verifique o status dos serviços:
```bash
docker compose ps
docker compose logs -f app
```

4. Para parar os containers:
```bash
make docker-down
```

---

## 📝 Como Cadastrar Novos Projetos (YAML com Hot-Reload)

Para adicionar um novo projeto (ou editar os existentes, como a **Plataforma de Investimentos** e o **Leitor de Mangá**), basta editar o arquivo [data/projects.yaml](data/projects.yaml):

```yaml
projects:
  - id: "novo-projeto"
    title: "Meu Novo Sistema Incrível"
    slug: "meu-novo-sistema" # Opcional: gerado automaticamente se omitido
    short_description: "Breve resumo para exibição no card inicial."
    description: |
      Descrição completa com detalhes técnicos e arquiteturais.
      Suporta quebras de linha e markdown simples.
    category: "Inteligência Artificial"
    tags:
      - "Golang"
      - "React"
      - "PyTorch"
      - "Docker"
    cover_image: "https://url-da-imagem.jpg"
    demo_url: "https://demo.meusite.com"
    github_url: "https://github.com/usuario/novo-projeto"
    status: "completed" # completed | in-progress | featured
    featured: true      # Exibe badge de destaque
    order: 4            # Posição na listagem
    metrics:
      requisicoes_sec: "15k req/s"
      acuracia: "99.4%"
```

> 💡 **Nota de Produção**: Como o diretório `./data` está montado como volume no Docker Compose, qualquer alteração salva em `data/projects.yaml` no servidor é **detectada instantaneamente**, recarregada na memória e sincronizada no PostgreSQL **sem derrubar a aplicação**!

---

## 💻 Dimensionamento de Recursos (Servidor 4 Cores / 8 GB RAM)

Este projeto foi desenhado com arquitetura de baixo overhead para que você possa hospedar seus múltiplos projetos no mesmo servidor VPS de 8 GB de RAM:

| Serviço / Aplicação | vCPU Alocado | RAM Típica | Limite no Compose | Função |
| :--- | :---: | :---: | :---: | :--- |
| **Portfólio App (Go + React)** | 1 Core | ~15 a 30 MB | 512 MB | Servir SPA estático e API REST |
| **PostgreSQL (Database)** | 1.5 Cores | ~100 a 200 MB | 1024 MB | Persistência e métricas |
| **Plataforma de Investimentos** | 1 Core | ~2 GB | - | Sistema final de finanças |
| **Leitor de Mangás Online** | 1 Core | ~2 GB | - | Sistema de catálogo/leitura |
| **Margem Livre do SO (Linux/Nginx)** | - | ~3.5 GB livres | - | Cache de I/O de disco e folga |

---

## 📡 Endpoints da API REST

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck da aplicação e verificação de ping no banco de dados. |
| `GET` | `/api/projects` | Retorna lista de projetos. Suporta query params `?category=` e `?tag=`. |
| `GET` | `/api/projects/{slug}` | Retorna dados completos de um projeto pelo seu slug. |
| `POST` | `/api/projects/{slug}/view` | Incrementa o contador de visualizações do projeto. |
| `POST` | `/api/contact` | Salva uma nova mensagem de contato (`name`, `email`, `subject`, `message`). |
| `GET` | `/api/stats` | Retorna estatísticas consolidadas (total de projetos, views, mensagens). |

---

## 📄 Licença
Distribuído sob a licença MIT. Sinta-se livre para usar e customizar como base para seu portfólio profissional!
# gemini
