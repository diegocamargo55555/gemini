package market

import "time"

// QuoteResult representa os dados consolidados de uma cotação
type QuoteResult struct {
	Symbol             string    `json:"symbol"`
	ShortName          string    `json:"short_name"`
	LongName           string    `json:"long_name"`
	Currency           string    `json:"currency"`
	CurrentPrice       float64   `json:"current_price"`
	PreviousClose      float64   `json:"previous_close"`
	Change             float64   `json:"change"`
	ChangePercent      float64   `json:"change_percent"`
	DayHigh            float64   `json:"day_high"`
	DayLow             float64   `json:"day_low"`
	Volume             int64     `json:"volume"`
	MarketCap          float64   `json:"market_cap,omitempty"`
	LogoURL            string    `json:"logo_url,omitempty"`
	Provider           string    `json:"provider"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// SearchResult representa um ativo retornado em busca
type SearchResult struct {
	Symbol   string `json:"symbol"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	Currency string `json:"currency"`
	Exchange string `json:"exchange"`
	Sector   string `json:"sector,omitempty"`
	Provider string `json:"provider"`
	LogoURL  string `json:"logo_url,omitempty"`
}

// Provider define a interface padrão de um provedor de cotações
type Provider interface {
	GetQuote(symbol string) (*QuoteResult, error)
	Search(query string) ([]SearchResult, error)
}
