package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"investimentos/internal/market"
	"investimentos/internal/service"
)

type Handler struct {
	accounts     *service.AccountService
	transactions *service.TransactionService
	investments  *service.InvestmentService
	portfolio    *service.PortfolioService
	brapi        *market.BrapiClient
	yahoo        *market.YahooClient
	fx           *market.FXService
}

func NewHandler(
	accounts *service.AccountService,
	transactions *service.TransactionService,
	investments *service.InvestmentService,
	portfolio *service.PortfolioService,
	brapi *market.BrapiClient,
	yahoo *market.YahooClient,
	fx *market.FXService,
) *Handler {
	return &Handler{
		accounts:     accounts,
		transactions: transactions,
		investments:  investments,
		portfolio:    portfolio,
		brapi:        brapi,
		yahoo:        yahoo,
		fx:           fx,
	}
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "investimentos-api",
		"version": "1.0.0",
	})
}
