package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"investimentos/internal/api"
	"investimentos/internal/config"
	"investimentos/internal/db"
	"investimentos/internal/market"
	"investimentos/internal/service"
)

func main() {
	cfg := config.Load()

	log.Printf("==================================================")
	log.Printf("💰 Plataforma de Gestão de Finanças & Investimentos")
	log.Printf("   Backend: Golang 1.25 + Gin + GORM")
	log.Printf("   Mercado Brasil: Brapi API")
	log.Printf("   Mercado Exterior: Yahoo Finance API")
	log.Printf("   Porta: %s | Static: %s", cfg.Port, cfg.StaticDir)
	log.Printf("==================================================")

	// 1. Inicializa Banco de Dados
	database, err := db.InitDB(cfg)
	if err != nil {
		log.Fatalf("Erro fatal ao inicializar banco de dados: %v", err)
	}

	// 2. Inicializa Provedores de Mercado e Câmbio
	brapiClient := market.NewBrapiClient(cfg.BrapiToken)
	yahooClient := market.NewYahooClient()
	fxService := market.NewFXService(yahooClient)

	// 3. Inicializa Serviços de Negócio
	accountSvc := service.NewAccountService(database)
	txSvc := service.NewTransactionService(database)
	invSvc := service.NewInvestmentService(database, brapiClient, yahooClient)
	portfolioSvc := service.NewPortfolioService(database, fxService)

	// 4. Inicializa Handler e Rotas Gin
	handler := api.NewHandler(accountSvc, txSvc, invSvc, portfolioSvc, brapiClient, yahooClient, fxService)
	router := api.SetupRouter(handler, cfg.StaticDir)

	// 5. Configura Servidor HTTP
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("🚀 Servidor escutando em http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Erro ao iniciar servidor HTTP: %v", err)
		}
	}()

	<-stop
	log.Printf("Encerrando servidor com segurança...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Erro durante encerramento forçado: %v", err)
	}

	log.Printf("Servidor encerrado.")
}
