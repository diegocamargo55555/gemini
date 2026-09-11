package domain_test

import (
	"testing"

	"portfolio/internal/domain"
)

func TestContactMessage_Validate(t *testing.T) {
	tests := []struct {
		name    string
		msg     domain.ContactMessage
		wantErr bool
	}{
		{
			name: "Mensagem válida",
			msg: domain.ContactMessage{
				Name:    "Maria Silva",
				Email:   "maria@exemplo.com",
				Subject: "Proposta de Projeto",
				Message: "Gostaria de conversar sobre o desenvolvimento de um aplicativo.",
			},
			wantErr: false,
		},
		{
			name: "Nome vazio",
			msg: domain.ContactMessage{
				Name:    "   ",
				Email:   "maria@exemplo.com",
				Message: "Olá mundo!",
			},
			wantErr: true,
		},
		{
			name: "Email inválido",
			msg: domain.ContactMessage{
				Name:    "Maria Silva",
				Email:   "email-sem-arroba",
				Message: "Olá mundo!",
			},
			wantErr: true,
		},
		{
			name: "Mensagem muito curta",
			msg: domain.ContactMessage{
				Name:    "Maria Silva",
				Email:   "maria@exemplo.com",
				Message: "Oi",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.msg.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() erro = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
