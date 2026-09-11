package domain

import (
	"errors"
	"net/mail"
	"strings"
	"time"
)

var (
	ErrContactNameRequired    = errors.New("o nome é obrigatório")
	ErrContactEmailInvalid    = errors.New("e-mail inválido")
	ErrContactMessageTooShort = errors.New("a mensagem deve ter pelo menos 5 caracteres")
)

type ContactMessage struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Subject   string    `json:"subject"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
	Read      bool      `json:"read"`
}

type Stats struct {
	TotalProjects int      `json:"total_projects"`
	TotalViews    int64    `json:"total_views"`
	TotalMessages int      `json:"total_messages"`
	Categories    []string `json:"categories"`
}

// Validate valida campos de nome, email e tamanho mínimo da mensagem
func (c *ContactMessage) Validate() error {
	c.Name = strings.TrimSpace(c.Name)
	if c.Name == "" {
		return ErrContactNameRequired
	}

	c.Email = strings.TrimSpace(c.Email)
	if _, err := mail.ParseAddress(c.Email); err != nil || !strings.Contains(c.Email, ".") {
		return ErrContactEmailInvalid
	}

	c.Message = strings.TrimSpace(c.Message)
	if len(c.Message) < 5 {
		return ErrContactMessageTooShort
	}

	if c.Subject == "" {
		c.Subject = "Contato via Portfólio"
	}

	return nil
}
