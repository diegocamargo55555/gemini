package domain

import (
	"errors"
	"regexp"
	"strings"
	"time"
)

var (
	ErrProjectTitleRequired = errors.New("o título do projeto é obrigatório")
	ErrProjectNotFound      = errors.New("projeto não encontrado")
)

type Project struct {
	ID               string            `json:"id" yaml:"id"`
	Title            string            `json:"title" yaml:"title"`
	Slug             string            `json:"slug" yaml:"slug"`
	ShortDescription string            `json:"short_description" yaml:"short_description"`
	Description      string            `json:"description" yaml:"description"`
	Category         string            `json:"category" yaml:"category"`
	Tags             []string          `json:"tags" yaml:"tags"`
	CoverImage       string            `json:"cover_image" yaml:"cover_image"`
	DemoURL          string            `json:"demo_url" yaml:"demo_url"`
	GithubURL        string            `json:"github_url" yaml:"github_url"`
	Status           string            `json:"status" yaml:"status"` // e.g. "completed", "in-progress", "featured"
	Featured         bool              `json:"featured" yaml:"featured"`
	Order            int               `json:"order" yaml:"order"`
	Metrics          map[string]string `json:"metrics,omitempty" yaml:"metrics,omitempty"`
	Views            int64             `json:"views" yaml:"-"`
	CreatedAt        time.Time         `json:"created_at" yaml:"-"`
	UpdatedAt        time.Time         `json:"updated_at" yaml:"-"`
}

var nonAlphanumericRegex = regexp.MustCompile(`[^a-z0-9]+`)

// GenerateSlug gera um slug amigável a partir do título
func GenerateSlug(title string) string {
	s := strings.ToLower(title)
	// Substituições comuns em português
	replacer := strings.NewReplacer(
		"ã", "a", "á", "a", "à", "a", "â", "a",
		"é", "e", "ê", "e",
		"í", "i",
		"ó", "o", "ô", "o", "õ", "o",
		"ú", "u",
		"ç", "c",
		"&", "e",
	)
	s = replacer.Replace(s)
	s = nonAlphanumericRegex.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

// Validate verifica se o projeto possui campos obrigatórios válidos
func (p *Project) Validate() error {
	if strings.TrimSpace(p.Title) == "" {
		return ErrProjectTitleRequired
	}
	if strings.TrimSpace(p.Slug) == "" {
		p.Slug = GenerateSlug(p.Title)
	}
	if strings.TrimSpace(p.ID) == "" {
		p.ID = p.Slug
	}
	if p.Tags == nil {
		p.Tags = []string{}
	}
	if p.Metrics == nil {
		p.Metrics = make(map[string]string)
	}
	if p.Status == "" {
		p.Status = "completed"
	}
	return nil
}
