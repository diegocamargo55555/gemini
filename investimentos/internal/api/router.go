package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(h *Handler, staticDir string) *gin.Engine {
	r := gin.New()

	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Configuração do CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Grupo de rotas da API
	api := r.Group("/api/v1")
	{
		api.GET("/health", h.Health)

		// Contas (Multi-moedas)
		api.GET("/accounts", h.ListAccounts)
		api.POST("/accounts", h.CreateAccount)
		api.GET("/accounts/:id", h.GetAccount)
		api.PUT("/accounts/:id", h.UpdateAccount)
		api.DELETE("/accounts/:id", h.DeleteAccount)

		// Transações e Fluxo de Caixa
		api.GET("/transactions", h.ListTransactions)
		api.POST("/transactions", h.CreateTransaction)
		api.POST("/transactions/transfer", h.Transfer)
		api.DELETE("/transactions/:id", h.DeleteTransaction)

		// Investimentos e Carteira
		api.GET("/investments/assets", h.ListAssets)
		api.GET("/investments/assets/:id", h.GetAsset)
		api.POST("/investments/orders", h.CreateOrder)
		api.POST("/investments/refresh", h.RefreshQuotes)
		api.DELETE("/investments/assets/:id", h.DeleteAsset)

		// Mercado e Cotações (Brapi & Yahoo Finance)
		api.GET("/market/quote", h.GetQuote)
		api.GET("/market/search", h.SearchMarket)
		api.GET("/market/rates", h.GetFXRates)
		api.GET("/market/convert", h.ConvertCurrency)

		// Consolidação Patrimonial
		api.GET("/portfolio/summary", h.GetPortfolioSummary)
	}

	// Servir frontend SPA estático
	setupFrontendServing(r, staticDir)

	return r
}

func setupFrontendServing(r *gin.Engine, staticDir string) {
	if staticDir == "" {
		candidates := []string{"frontend/dist", "dist", "public"}
		for _, c := range candidates {
			if info, err := os.Stat(c); err == nil && info.IsDir() {
				staticDir = c
				break
			}
		}
	}

	indexPath := filepath.Join(staticDir, "index.html")

	// Fallback e arquivos estáticos
	r.NoRoute(func(c *gin.Context) {
		reqPath := c.Request.URL.Path

		// Se for rota de API que não existe, retorna 404 JSON
		if strings.HasPrefix(reqPath, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint não encontrado"})
			return
		}

		// Se arquivo físico existe no diretório estático, serve-o
		targetFile := filepath.Join(staticDir, filepath.Clean(reqPath))
		if info, err := os.Stat(targetFile); err == nil && !info.IsDir() {
			c.File(targetFile)
			return
		}

		// Se o SPA index.html existir, serve-o para permitir rotas no cliente
		if _, err := os.Stat(indexPath); err == nil {
			c.File(indexPath)
			return
		}

		// Mensagem de boas-vindas se o frontend ainda não tiver sido compilado
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(`
			<!DOCTYPE html>
			<html lang="pt-BR">
			<head>
				<meta charset="UTF-8">
				<title>Investimentos & Finanças API</title>
				<style>
					body { font-family: system-ui, sans-serif; background: #0b1329; color: #f1f5f9; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; text-align: center; }
					.card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; max-width: 600px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
					h1 { color: #38bdf8; margin-top: 0; }
					a { color: #38bdf8; text-decoration: none; font-weight: bold; }
					code { background: #0f172a; padding: 0.2rem 0.5rem; border-radius: 4px; color: #f43f5e; }
				</style>
			</head>
			<body>
				<div class="card">
					<h1>🚀 Plataforma de Investimentos e Finanças</h1>
					<p>O backend <strong>Golang + Gin + GORM</strong> está ativo e pronto!</p>
					<p>APIs integradas: <strong>Brapi</strong> (B3 Brasil) & <strong>Yahoo Finance</strong> (Global/EUA).</p>
					<p>Acesse os endpoints em <a href="/api/v1/health">/api/v1/health</a> e <a href="/api/v1/portfolio/summary">/api/v1/portfolio/summary</a>.</p>
					<p style="font-size: 0.85rem; color: #94a3b8; margin-top: 1.5rem;">Compilando frontend em <code>frontend/dist</code>...</p>
				</div>
			</body>
			</html>
		`))
	})
}
