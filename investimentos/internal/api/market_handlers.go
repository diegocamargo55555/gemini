package api

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"investimentos/internal/market"
)

func (h *Handler) GetQuote(c *gin.Context) {
	symbol := strings.ToUpper(strings.TrimSpace(c.Query("symbol")))
	provider := strings.ToUpper(strings.TrimSpace(c.Query("provider")))

	if symbol == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetro 'symbol' é obrigatório"})
		return
	}

	var quote *market.QuoteResult
	var err error

	// Auto-detecção de provedor se não especificado
	if provider == "" {
		if strings.HasSuffix(symbol, "3") || strings.HasSuffix(symbol, "4") || strings.HasSuffix(symbol, "11") || strings.HasSuffix(symbol, "34") {
			provider = "BRAPI"
		} else {
			provider = "YAHOO"
		}
	}

	if provider == "BRAPI" {
		quote, err = h.brapi.GetQuote(symbol)
		// Fallback para Yahoo se Brapi falhar
		if err != nil {
			quote, err = h.yahoo.GetQuote(symbol + ".SA")
		}
	} else {
		quote, err = h.yahoo.GetQuote(symbol)
		// Fallback para Brapi se Yahoo falhar e parecer ativo BR
		if err != nil && (strings.HasSuffix(symbol, "3") || strings.HasSuffix(symbol, "4") || strings.HasSuffix(symbol, "11")) {
			quote, err = h.brapi.GetQuote(symbol)
		}
	}

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cotação não encontrada: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, quote)
}

func (h *Handler) SearchMarket(c *gin.Context) {
	query := strings.TrimSpace(c.Query("query"))
	if query == "" {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	provider := strings.ToUpper(strings.TrimSpace(c.Query("provider")))

	var results []market.SearchResult

	if provider == "BRAPI" {
		res, _ := h.brapi.Search(query)
		results = append(results, res...)
	} else if provider == "YAHOO" {
		res, _ := h.yahoo.Search(query)
		results = append(results, res...)
	} else {
		// Pesquisa em ambos para dar a melhor experiência ao usuário!
		brapiRes, _ := h.brapi.Search(query)
		yahooRes, _ := h.yahoo.Search(query)

		results = append(results, brapiRes...)
		for _, y := range yahooRes {
			// Evita duplicatas se já existe na brapi
			exists := false
			for _, b := range brapiRes {
				if strings.EqualFold(b.Symbol, y.Symbol) || strings.EqualFold(b.Symbol+".SA", y.Symbol) {
					exists = true
					break
				}
			}
			if !exists {
				results = append(results, y)
			}
		}
	}

	c.JSON(http.StatusOK, results)
}

func (h *Handler) GetFXRates(c *gin.Context) {
	rates := h.fx.GetAllRates()
	c.JSON(http.StatusOK, rates)
}

func (h *Handler) ConvertCurrency(c *gin.Context) {
	from := c.DefaultQuery("from", "USD")
	to := c.DefaultQuery("to", "BRL")
	amountStr := c.DefaultQuery("amount", "1")

	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valor inválido"})
		return
	}

	converted, rate, err := h.fx.Convert(amount, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"from":      from,
		"to":        to,
		"amount":    amount,
		"converted": converted,
		"rate":      rate,
	})
}
