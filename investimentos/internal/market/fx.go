package market

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

type FXService struct {
	yahoo      *YahooClient
	cacheMutex sync.RWMutex
	ratesCache map[string]float64
	lastUpdate time.Time
}

// Default fallback rates to BRL (used if offline or rate limit)
var defaultRatesToBRL = map[string]float64{
	"BRL": 1.0,
	"USD": 5.65,
	"EUR": 6.18,
	"GBP": 7.30,
	"CAD": 4.15,
	"JPY": 0.038,
	"CHF": 6.55,
	"BTC": 385000.0,
	"ETH": 18500.0,
}

func NewFXService(yahoo *YahooClient) *FXService {
	svc := &FXService{
		yahoo:      yahoo,
		ratesCache: make(map[string]float64),
	}
	// Inicializa com taxas padrão
	for k, v := range defaultRatesToBRL {
		svc.ratesCache[k] = v
	}
	// Dispara atualização em background
	go svc.RefreshRates()
	return svc
}

// RefreshRates busca taxas de câmbio recentes via Yahoo Finance
func (f *FXService) RefreshRates() {
	pairs := map[string]string{
		"USD": "USDBRL=X",
		"EUR": "EURBRL=X",
		"GBP": "GBPBRL=X",
		"CAD": "CADBRL=X",
		"JPY": "JPYBRL=X",
		"CHF": "CHFBRL=X",
		"BTC": "BTC-BRL",
	}

	for curr, symbol := range pairs {
		quote, err := f.yahoo.GetQuote(symbol)
		if err == nil && quote.CurrentPrice > 0 {
			f.cacheMutex.Lock()
			f.ratesCache[curr] = quote.CurrentPrice
			f.cacheMutex.Unlock()
		}
	}
	f.cacheMutex.Lock()
	f.lastUpdate = time.Now()
	f.cacheMutex.Unlock()
}

// GetRateToBRL retorna quantos BRL vale 1 unidade da moeda fornecida
func (f *FXService) GetRateToBRL(currency string) float64 {
	currency = strings.ToUpper(strings.TrimSpace(currency))
	if currency == "BRL" || currency == "" {
		return 1.0
	}

	f.cacheMutex.RLock()
	rate, ok := f.ratesCache[currency]
	f.cacheMutex.RUnlock()

	if ok && rate > 0 {
		return rate
	}

	if def, ok := defaultRatesToBRL[currency]; ok {
		return def
	}

	return 1.0
}

// GetRate retorna a taxa de conversão: 1 From = X To
func (f *FXService) GetRate(from, to string) (float64, error) {
	from = strings.ToUpper(strings.TrimSpace(from))
	to = strings.ToUpper(strings.TrimSpace(to))

	if from == to {
		return 1.0, nil
	}

	fromToBRL := f.GetRateToBRL(from)
	toToBRL := f.GetRateToBRL(to)

	if toToBRL <= 0 {
		return 0, fmt.Errorf("taxa de conversão para %s indisponível", to)
	}

	// Exemplo: 1 USD vale 5.65 BRL. 1 EUR vale 6.18 BRL.
	// 1 USD para EUR = (5.65) / (6.18) = 0.914 EUR
	rate := fromToBRL / toToBRL
	return rate, nil
}

// Convert converte um valor de 'from' para 'to'
func (f *FXService) Convert(amount float64, from, to string) (float64, float64, error) {
	rate, err := f.GetRate(from, to)
	if err != nil {
		return amount, 1.0, err
	}
	return amount * rate, rate, nil
}

// GetAllRates retorna todas as taxas mapeadas em relação ao BRL e USD
func (f *FXService) GetAllRates() map[string]interface{} {
	f.cacheMutex.RLock()
	defer f.cacheMutex.RUnlock()

	rates := make(map[string]float64)
	for k, v := range f.ratesCache {
		rates[k] = v
	}

	usdBrl := f.GetRateToBRL("USD")
	eurBrl := f.GetRateToBRL("EUR")
	gbpBrl := f.GetRateToBRL("GBP")

	return map[string]interface{}{
		"base": "BRL",
		"rates_to_brl": rates,
		"popular_pairs": map[string]float64{
			"USD/BRL": usdBrl,
			"EUR/BRL": eurBrl,
			"GBP/BRL": gbpBrl,
			"EUR/USD": eurBrl / usdBrl,
			"GBP/USD": gbpBrl / usdBrl,
		},
		"last_updated": f.lastUpdate,
	}
}
