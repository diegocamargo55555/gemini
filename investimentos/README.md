# 💰 Plataforma de Gestão de Finanças & Investimentos Multimoeda

Sistema completo de alto desempenho para gestão financeira pessoal e consolidação de carteira de investimentos em **múltiplas moedas**, com integração em tempo real às APIs da **Brapi** (mercado B3 Brasil) e do **Yahoo Finance** (mercado exterior, ETFs globais, criptoativos e câmbio FX).

Construído com **Golang (Go 1.25)**, **Gin Framework**, **GORM**, **SQLite / PostgreSQL**, **React 19**, **TypeScript** e **TailwindCSS v4**.

---

## 🌟 Principais Funcionalidades

### 1. 💱 Gestão de Contas Multimoeda
- Criação e acompanhamento de contas em **múltiplas moedas**:
  - 🇧🇷 **BRL** (Real Brasileiro)
  - 🇺🇸 **USD** (Dólar Americano)
  - 🇪🇺 **EUR** (Euro)
  - 🇬🇧 **GBP** (Libra Esterlina)
  - 🇨🇦 **CAD** (Dólar Canadense)
  - 🇯🇵 **JPY** (Iene Japonês)
  - 🪙 **BTC** / **ETH** (Criptomoedas)
- Tipos de conta: **Conta Corrente**, **Corretora / Investimentos**, **Reserva / Poupança**, **Dinheiro Físico**, **Carteira Cripto**.
- **Transferências Multimoeda & Câmbio Automático**: Transferência entre contas de diferentes moedas (ex: enviar R$ 565,00 do Nubank para receber $ 100,00 na Nomad) com apuração automática de taxa cambial via Yahoo Finance.
- **Consolidação Cambial Dinâmica**: Alterne a moeda base (BRL, USD, EUR, GBP) com 1 clique e veja todo o patrimônio e saldos convertidos instantaneamente.

### 2. 🇧🇷 Ativos no Brasil (API Brapi)
- Cotações em tempo real de ativos listados na **B3**:
  - **Ações** (ex: `PETR4`, `VALE3`, `ITUB4`, `WEGE3`, etc.)
  - **Fundos Imobiliários / FIIs** (ex: `HGLG11`, `MXRF11`, `KNRI11`, `XPML11`, etc.)
  - **BDRs** (ex: `AAPL34`, `NVDC34`, etc.)
- Cache em memória inteligente (TTL 3 min) com suporte a token de autenticação via variável `BRAPI_TOKEN`.
- Busca instantânea e auto-complete de ativos B3 com logos oficiais e setores.

### 3. 🌐 Ativos no Exterior (Yahoo Finance)
- Cotações ao vivo de ativos globais:
  - **Ações dos EUA** (ex: `AAPL`, `MSFT`, `NVDA`, `TSLA`, `GOOGL`, etc.)
  - **ETFs Internacionais** (ex: `VOO`, `SPY`, `QQQ`, `IVV`, etc.)
  - **Criptoativos** (ex: `BTC-USD`, `ETH-USD`, `SOL-USD`)
  - **Taxas de Câmbio em Tempo Real** (`USDBRL=X`, `EURBRL=X`, `GBPBRL=X`, `EURUSD=X`).
- Cálculo de variação do dia, máximas e mínimas, volume e fechamento anterior.

### 4. 📈 Gestão da Carteira & Ordens
- Cálculo automático de **Preço Médio Ponderado (PM)** em novas compras.
- Controle de lucros e prejuízos realizados e não-realizados (valor monetário e percentual).
- Suporte a operações de:
  - 🟢 **Compra (Buy)**: Debita o valor investido (+ taxas) do saldo da conta vinculada e recalcula o preço médio.
  - 🔴 **Venda (Sell)**: Credita o valor total (- taxas) na conta e atualiza a quantidade em custódia.
  - 🟡 **Proventos / Dividendos (Dividend)**: Credita dividendos diretamente na conta sem alterar o preço médio.
- Gráficos e indicadores de **Alocação por Classe de Ativo** e **Exposição por Moeda**.

---

## 🏗️ Arquitetura do Projeto

```text
investimentos/
├── cmd/
│   └── server/
│       ├── main.go                     # Entrypoint HTTP, Gin engine e graceful shutdown
│       └── main_test.go
├── internal/
│   ├── config/
│   │   └── config.go                   # Variáveis de ambiente (PORT, DB_PATH, BRAPI_TOKEN)
│   ├── models/
│   │   └── models.go                   # Modelos GORM (Account, Transaction, Asset, Order, FX)
│   ├── db/
│   │   └── database.go                 # Inicialização GORM (SQLite/Postgres) e Seed inicial
│   ├── market/
│   │   ├── provider.go                 # Interfaces de cotação
│   │   ├── brapi.go                    # Cliente da API Brapi (Brasil / B3)
│   │   ├── yahoo.go                    # Cliente da API Yahoo Finance (Exterior)
│   │   └── fx.go                       # Motor de conversão cambial multimoeda
│   ├── service/
│   │   ├── account_service.go          # Lógica de contas e saldos
│   │   ├── transaction_service.go      # Fluxo de caixa e transferências cambiais
│   │   ├── investment_service.go       # Ordens, preço médio e cotações
│   │   ├── portfolio_service.go        # Consolidação patrimonial e alocações
│   │   └── service_test.go             # Testes de integração em banco in-memory
│   └── api/
│       ├── handlers.go                 # Base do handler Gin
│       ├── account_handlers.go         # Endpoints de contas
│       ├── transaction_handlers.go     # Endpoints de transações
│       ├── investment_handlers.go      # Endpoints de investimentos
│       ├── market_handlers.go          # Endpoints de busca e cotações ao vivo
│       ├── portfolio_handlers.go       # Endpoints de consolidação
│       └── router.go                   # Roteamento Gin, CORS e SPA serving
├── frontend/                           # Interface Web SPA moderna
│   ├── src/
│   │   ├── components/                 # Navbar, SummaryCards, PortfolioView, Modais
│   │   ├── api/client.ts               # Cliente HTTP tipado
│   │   ├── types/                      # Interfaces TypeScript
│   │   └── App.tsx                     # Aplicação React com abas e dashboard
│   ├── package.json
│   └── vite.config.ts
├── Dockerfile                          # Multi-stage build otimizado (~25MB Alpine)
├── docker-compose.yml                  # Deploy com 1 comando
├── Makefile                            # Automação de compilação e testes
└── README.md
```

---

## 🚀 Como Executar

### Pré-requisitos
- **Go 1.22+** (ou 1.25)
- **Node.js 20+** e **npm**

### Opção 1: Execução Local Rápida

```bash
# 1. Navegue até o diretório do projeto
cd investimentos

# 2. Compile e execute com o Makefile
make build
make run

# Ou execute manualmente:
cd frontend && npm install && npm run build && cd ..
go run cmd/server/main.go
```

Acesse no navegador: **`http://localhost:8084`**

---

### Opção 2: Com Docker Compose

```bash
cd investimentos
docker compose up --build -d
```

A aplicação estará disponível em `http://localhost:8084` com persistência de dados em volume Docker.

---

## 🧪 Executando os Testes

O projeto possui suíte de testes com banco SQLite in-memory que valida:
- Criação de contas em múltiplas moedas e integridade de saldos;
- Transferências cambiais com conversão de moedas (BRL -> USD);
- Cálculo automático de preço médio ponderado em múltiplas ordens;
- Consolidação patrimonial multimoeda.

Para rodar os testes:
```bash
make test
# Ou diretamente:
go test -v ./...
```

---

## 📡 Endpoints da API REST (`/api/v1`)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/v1/health` | Status da API |
| `GET` | `/api/v1/portfolio/summary?base_currency=BRL` | Resumo consolidado do patrimônio, alocações e rendimento |
| `GET` | `/api/v1/accounts` | Lista todas as contas e seus saldos em moeda nativa |
| `POST` | `/api/v1/accounts` | Cria nova conta em qualquer moeda (BRL, USD, EUR, etc.) |
| `PUT` | `/api/v1/accounts/:id` | Atualiza dados de uma conta |
| `DELETE` | `/api/v1/accounts/:id` | Remove conta e dados associados |
| `GET` | `/api/v1/transactions` | Lista movimentações financeiras com filtros e paginação |
| `POST` | `/api/v1/transactions` | Registra nova receita ou despesa |
| `POST` | `/api/v1/transactions/transfer` | Executa transferência entre contas (inclusive com câmbio) |
| `DELETE` | `/api/v1/transactions/:id` | Remove transação e reverte saldo |
| `GET` | `/api/v1/investments/assets` | Lista ativos mantidos em carteira |
| `POST` | `/api/v1/investments/orders` | Executa ordem de Compra, Venda ou Dividendo |
| `POST` | `/api/v1/investments/refresh` | Sincroniza cotações em tempo real na Brapi e Yahoo |
| `GET` | `/api/v1/market/quote?symbol=PETR4` | Obtém cotação ao vivo via Brapi ou Yahoo |
| `GET` | `/api/v1/market/search?query=vale` | Pesquisa de ativos e tickers |
| `GET` | `/api/v1/market/rates` | Cotações cambiais comerciais em tempo real |
| `GET` | `/api/v1/market/convert?amount=100&from=USD&to=BRL` | Conversor cambial instantâneo |

---

## 🔒 Variáveis de Ambiente Opcionais

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `8084` | Porta do servidor HTTP |
| `DB_PATH` | `data/investimentos.db` | Caminho do arquivo SQLite |
| `DATABASE_URL` | *(vazio)* | Se configurado, conecta a um PostgreSQL externo |
| `STATIC_DIR` | `frontend/dist` | Diretório dos arquivos estáticos compilados do React |
| `BRAPI_TOKEN` | *(vazio)* | Token da API Brapi (opcional, para limites estendidos) |
| `GIN_MODE` | `release` | Modo de execução do framework Gin |
