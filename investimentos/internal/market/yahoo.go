package market

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

type YahooClient struct {
	httpClient *http.Client
	cacheMutex sync.RWMutex
	quoteCache map[string]cachedQuote
}

func NewYahooClient() *YahooClient {
	return &YahooClient{
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		quoteCache: make(map[string]cachedQuote),
	}
}

type yahooChartResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Currency                   string  `json:"currency"`
				Symbol                     string  `json:"symbol"`
				ExchangeName               string  `json:"exchangeName"`
				InstrumentType             string  `json:"instrumentType"`
				RegularMarketPrice         float64 `json:"regularMarketPrice"`
				RegularMarketChangePercent float64 `json:"regularMarketChangePercent"`
				ChartPreviousClose         float64 `json:"chartPreviousClose"`
				RegularMarketDayHigh       float64 `json:"regularMarketDayHigh"`
				RegularMarketDayLow        float64 `json:"regularMarketDayLow"`
				RegularMarketVolume        int64   `json:"regularMarketVolume"`
				LongName                   string  `json:"longName"`
				ShortName                  string  `json:"shortName"`
			} `json:"meta"`
		} `json:"result"`
		Error *struct {
			Code        string `json:"code"`
			Description string `json:"description"`
		} `json:"error"`
	} `json:"chart"`
}

type yahooSearchResponse struct {
	Quotes []struct {
		Symbol    string  `json:"symbol"`
		Shortname string  `json:"shortname"`
		Longname  string  `json:"longname"`
		QuoteType string  `json:"quoteType"`
		ExchDisp  string  `json:"exchDisp"`
		Sector    string  `json:"sector"`
		Score     float64 `json:"score"`
	} `json:"quotes"`
}

func (c *YahooClient) GetQuote(symbol string) (*QuoteResult, error) {
	symbol = strings.ToUpper(strings.TrimSpace(symbol))
	if symbol == "" {
		return nil, fmt.Errorf("símbolo inválido")
	}

	// Verifica cache em memória (TTL de 3 minutos)
	c.cacheMutex.RLock()
	cached, found := c.quoteCache[symbol]
	c.cacheMutex.RUnlock()
	if found && time.Now().Before(cached.expiresAt) {
		return cached.data, nil
	}

	reqURL := fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=1d", url.PathEscape(symbol))
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("falha ao consultar Yahoo Finance: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("yahoo retornou status %d: %s", resp.StatusCode, string(body))
	}

	var data yahooChartResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("erro ao decodificar JSON do Yahoo: %w", err)
	}

	if data.Chart.Error != nil {
		return nil, fmt.Errorf("yahoo erro: %s - %s", data.Chart.Error.Code, data.Chart.Error.Description)
	}

	if len(data.Chart.Result) == 0 {
		return nil, fmt.Errorf("nenhum resultado retornado pelo Yahoo para %s", symbol)
	}

	meta := data.Chart.Result[0].Meta
	name := meta.LongName
	if name == "" {
		name = meta.ShortName
	}
	if name == "" {
		name = meta.Symbol
	}

	curr := meta.Currency
	if curr == "" {
		curr = "USD"
	}

	changeVal := meta.RegularMarketPrice - meta.ChartPreviousClose
	changePct := meta.RegularMarketChangePercent
	if changePct == 0 && meta.ChartPreviousClose > 0 {
		changePct = (changeVal / meta.ChartPreviousClose) * 100
	}

	res := &QuoteResult{
		Symbol:        meta.Symbol,
		ShortName:     meta.ShortName,
		LongName:      name,
		Currency:      curr,
		CurrentPrice:  meta.RegularMarketPrice,
		PreviousClose: meta.ChartPreviousClose,
		Change:        changeVal,
		ChangePercent: changePct,
		DayHigh:       meta.RegularMarketDayHigh,
		DayLow:        meta.RegularMarketDayLow,
		Volume:        meta.RegularMarketVolume,
		Provider:      "YAHOO",
		UpdatedAt:     time.Now(),
	}

	// Cache TTL 3 minutos
	c.cacheMutex.Lock()
	c.quoteCache[symbol] = cachedQuote{
		data:      res,
		expiresAt: time.Now().Add(3 * time.Minute),
	}
	c.cacheMutex.Unlock()

	return res, nil
}

func (c *YahooClient) Search(query string) ([]SearchResult, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, nil
	}

	reqURL := fmt.Sprintf("https://query1.finance.yahoo.com/v1/finance/search?q=%s&quotesCount=10&newsCount=0", url.QueryEscape(query))
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("falha ao pesquisar Yahoo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("yahoo search retornou status %d", resp.StatusCode)
	}

	var data yahooSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	results := make([]SearchResult, 0, len(data.Quotes))
	for _, q := range data.Quotes {
		name := q.Longname
		if name == "" {
			name = q.Shortname
		}
		if name == "" {
			name = q.Symbol
		}

		currency := "USD"
		if strings.HasSuffix(q.Symbol, ".SA") {
			currency = "BRL"
		} else if strings.HasSuffix(q.Symbol, ".L") {
			currency = "GBP"
		} else if strings.HasSuffix(q.Symbol, ".DE") || strings.HasSuffix(q.Symbol, ".PA") {
			currency = "EUR"
		}

		results = append(results, SearchResult{
			Symbol:   q.Symbol,
			Name:     name,
			Type:     q.QuoteType,
			Currency: currency,
			Exchange: q.ExchDisp,
			Sector:   q.Sector,
			Provider: "YAHOO",
		})
	}

	return results, nil
}
