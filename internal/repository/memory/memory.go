package memory

import (
	"context"
	"sort"
	"strings"
	"sync"
	"time"

	"portfolio/internal/domain"
	"portfolio/internal/repository"
)

var _ repository.Repository = (*MemoryRepository)(nil)

type MemoryRepository struct {
	mu       sync.RWMutex
	projects map[string]domain.Project // key: slug
	messages []domain.ContactMessage
	nextMsgID int64
}

func NewMemoryRepository() *MemoryRepository {
	return &MemoryRepository{
		projects:  make(map[string]domain.Project),
		messages:  make([]domain.ContactMessage, 0),
		nextMsgID: 1,
	}
}

func (m *MemoryRepository) SyncProjects(ctx context.Context, projects []domain.Project) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	newMap := make(map[string]domain.Project, len(projects))
	now := time.Now()

	for _, p := range projects {
		existing, found := m.projects[p.Slug]
		if found {
			p.Views = existing.Views
			p.CreatedAt = existing.CreatedAt
			p.UpdatedAt = now
		} else {
			p.CreatedAt = now
			p.UpdatedAt = now
		}
		newMap[p.Slug] = p
	}

	m.projects = newMap
	return nil
}

func (m *MemoryRepository) GetAllProjects(ctx context.Context, category, tag string) ([]domain.Project, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]domain.Project, 0, len(m.projects))
	catFilter := strings.ToLower(strings.TrimSpace(category))
	tagFilter := strings.ToLower(strings.TrimSpace(tag))

	for _, p := range m.projects {
		if catFilter != "" && !strings.Contains(strings.ToLower(p.Category), catFilter) {
			continue
		}

		if tagFilter != "" {
			matched := false
			for _, t := range p.Tags {
				if strings.EqualFold(t, tagFilter) {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}

		result = append(result, p)
	}

	// Ordena por Order crescente
	sort.SliceStable(result, func(i, j int) bool {
		return result[i].Order < result[j].Order
	})

	return result, nil
}

func (m *MemoryRepository) GetProjectBySlug(ctx context.Context, slug string) (*domain.Project, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	p, found := m.projects[slug]
	if !found {
		return nil, domain.ErrProjectNotFound
	}
	return &p, nil
}

func (m *MemoryRepository) IncrementProjectViews(ctx context.Context, slug string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	p, found := m.projects[slug]
	if !found {
		return 0, domain.ErrProjectNotFound
	}
	p.Views++
	m.projects[slug] = p
	return p.Views, nil
}

func (m *MemoryRepository) SaveContactMessage(ctx context.Context, msg *domain.ContactMessage) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	msg.ID = m.nextMsgID
	m.nextMsgID++
	msg.CreatedAt = time.Now()
	m.messages = append(m.messages, *msg)
	return nil
}

func (m *MemoryRepository) GetContactMessages(ctx context.Context) ([]domain.ContactMessage, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	res := make([]domain.ContactMessage, len(m.messages))
	copy(res, m.messages)
	return res, nil
}

func (m *MemoryRepository) GetStats(ctx context.Context) (*domain.Stats, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var totalViews int64
	categoriesMap := make(map[string]struct{})

	for _, p := range m.projects {
		totalViews += p.Views
		if p.Category != "" {
			categoriesMap[p.Category] = struct{}{}
		}
	}

	categories := make([]string, 0, len(categoriesMap))
	for cat := range categoriesMap {
		categories = append(categories, cat)
	}
	sort.Strings(categories)

	return &domain.Stats{
		TotalProjects: len(m.projects),
		TotalViews:    totalViews,
		TotalMessages: len(m.messages),
		Categories:    categories,
	}, nil
}

func (m *MemoryRepository) Ping(ctx context.Context) error {
	return nil
}

func (m *MemoryRepository) Close() error {
	return nil
}
