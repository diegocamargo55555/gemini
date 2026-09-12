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

type BrapiClient struct {
	token      string
	httpClient *http.Client
	cacheMutex sync.RWMutex
	quoteCache map[string]cachedQuote
}

type cachedQuote struct {
	data      *QuoteResult
	expiresAt time.Time
}

func NewBrapiClient(token string) *BrapiClient {
	return &BrapiClient{
		token: token,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		quoteCache: make(map[string]cachedQuote),
	}
}

type brapiResponse struct {
	Results []struct {
		Symbol                     string  `json:"symbol"`
		ShortName                  string  `json:"shortName"`
		LongName                   string  `json:"longName"`
		Currency                   string  `json:"currency"`
		RegularMarketPrice         float64 `json:"regularMarketPrice"`
		RegularMarketDayHigh       float64 `json:"regularMarketDayHigh"`
		RegularMarketDayLow        float64 `json:"regularMarketDayLow"`
		RegularMarketChange        float64 `json:"regularMarketChange"`
		RegularMarketChangePercent float64 `json:"regularMarketChangePercent"`
		RegularMarketPreviousClose float64 `json:"regularMarketPreviousClose"`
		RegularMarketVolume        int64   `json:"regularMarketVolume"`
		MarketCap                  float64 `json:"marketCap"`
		LogoURL                    string  `json:"logourl"`
	} `json:"results"`
	Error   bool   `json:"error"`
	Message string `json:"message"`
}

type brapiListResponse struct {
	Indexes []interface{} `json:"indexes"`
	Stocks  []struct {
		Stock     string  `json:"stock"`
		Name      string  `json:"name"`
		Close     float64 `json:"close"`
		Change    float64 `json:"change"`
		Sector    string  `json:"sector"`
		Type      string  `json:"type"`
		SubType   string  `json:"subType"`
		Logo      string  `json:"logo"`
		MarketCap float64 `json:"market_cap"`
	} `json:"stocks"`
}

func (c *BrapiClient) GetQuote(symbol string) (*QuoteResult, error) {
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

	reqURL := fmt.Sprintf("https://brapi.dev/api/quote/%s", url.PathEscape(symbol))
	if c.token != "" {
		reqURL += fmt.Sprintf("?token=%s", url.QueryEscape(c.token))
	}

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityFinance/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("falha ao consultar brapi: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("brapi retornou status %d: %s", resp.StatusCode, string(body))
	}

	var data brapiResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("erro ao decodificar JSON da brapi: %w", err)
	}

	if len(data.Results) == 0 {
		return nil, fmt.Errorf("nenhum resultado encontrado na brapi para %s", symbol)
	}

	r := data.Results[0]
	curr := r.Currency
	if curr == "" {
		curr = "BRL"
	}
	name := r.LongName
	if name == "" {
		name = r.ShortName
	}
	if name == "" {
		name = r.Symbol
	}

	res := &QuoteResult{
		Symbol:        r.Symbol,
		ShortName:     r.ShortName,
		LongName:      name,
		Currency:      curr,
		CurrentPrice:  r.RegularMarketPrice,
		PreviousClose: r.RegularMarketPreviousClose,
		Change:        r.RegularMarketChange,
		ChangePercent: r.RegularMarketChangePercent,
		DayHigh:       r.RegularMarketDayHigh,
		DayLow:        r.RegularMarketDayLow,
		Volume:        r.RegularMarketVolume,
		MarketCap:     r.MarketCap,
		LogoURL:       r.LogoURL,
		Provider:      "BRAPI",
		UpdatedAt:     time.Now(),
	}

	// Grava em cache
	c.cacheMutex.Lock()
	c.quoteCache[symbol] = cachedQuote{
		data:      res,
		expiresAt: time.Now().Add(3 * time.Minute),
	}
	c.cacheMutex.Unlock()

	return res, nil
}

func (c *BrapiClient) Search(query string) ([]SearchResult, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, nil
	}

	reqURL := fmt.Sprintf("https://brapi.dev/api/quote/list?search=%s&limit=12", url.QueryEscape(query))
	if c.token != "" {
		reqURL += fmt.Sprintf("&token=%s", url.QueryEscape(c.token))
	}

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityFinance/1.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("falha ao pesquisar na brapi: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("brapi busca retornou status %d", resp.StatusCode)
	}

	var data brapiListResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	results := make([]SearchResult, 0, len(data.Stocks))
	for _, s := range data.Stocks {
		assetType := "STOCK"
		if strings.EqualFold(s.Type, "fund") || strings.EqualFold(s.SubType, "fii") || strings.HasSuffix(s.Stock, "11") {
			assetType = "FII"
		} else if strings.HasSuffix(s.Stock, "34") || strings.HasSuffix(s.Stock, "35") {
			assetType = "BDR"
		}

		results = append(results, SearchResult{
			Symbol:   s.Stock,
			Name:     s.Name,
			Type:     assetType,
			Currency: "BRL",
			Exchange: "B3",
			Sector:   s.Sector,
			Provider: "BRAPI",
			LogoURL:  s.Logo,
		})
	}

	return results, nil
}
