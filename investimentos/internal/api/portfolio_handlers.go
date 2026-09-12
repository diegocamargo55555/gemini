package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetPortfolioSummary(c *gin.Context) {
	baseCurrency := c.DefaultQuery("base_currency", "BRL")

	summary, err := h.portfolio.GetSummary(baseCurrency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao compor resumo patrimonial: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}
