package repository

import (
	"context"

	"portfolio/internal/domain"
)

type Repository interface {
	SyncProjects(ctx context.Context, projects []domain.Project) error
	GetAllProjects(ctx context.Context, category, tag string) ([]domain.Project, error)
	GetProjectBySlug(ctx context.Context, slug string) (*domain.Project, error)
	IncrementProjectViews(ctx context.Context, slug string) (int64, error)
	SaveContactMessage(ctx context.Context, msg *domain.ContactMessage) error
	GetContactMessages(ctx context.Context) ([]domain.ContactMessage, error)
	GetStats(ctx context.Context) (*domain.Stats, error)
	Ping(ctx context.Context) error
	Close() error
}
