package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"portfolio/internal/domain"
	"portfolio/internal/repository"
)

var _ repository.Repository = (*PostgresRepository)(nil)

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(ctx context.Context, connString string) (*PostgresRepository, error) {
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("string de conexão inválida: %w", err)
	}

	// Otimizações para 4 vCPUs e 8GB RAM
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar ao postgres: %w", err)
	}

	repo := &PostgresRepository{pool: pool}
	if err := repo.migrate(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("falha ao executar migrações: %w", err)
	}

	return repo, nil
}

func (r *PostgresRepository) migrate(ctx context.Context) error {
	schema := `
	CREATE TABLE IF NOT EXISTS projects (
		id VARCHAR(100) PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		slug VARCHAR(255) UNIQUE NOT NULL,
		short_description TEXT,
		description TEXT,
		category VARCHAR(100),
		tags TEXT[] DEFAULT '{}',
		cover_image TEXT,
		demo_url TEXT,
		github_url TEXT,
		status VARCHAR(50) DEFAULT 'completed',
		featured BOOLEAN DEFAULT false,
		order_idx INT DEFAULT 0,
		metrics JSONB DEFAULT '{}',
		views BIGINT DEFAULT 0,
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
	CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);

	CREATE TABLE IF NOT EXISTS contact_messages (
		id BIGSERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		email VARCHAR(255) NOT NULL,
		subject VARCHAR(255),
		message TEXT NOT NULL,
		read BOOLEAN DEFAULT false,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_messages(created_at DESC);
	`
	_, err := r.pool.Exec(ctx, schema)
	return err
}

func (r *PostgresRepository) SyncProjects(ctx context.Context, projects []domain.Project) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("falha ao iniciar transação: %w", err)
	}
	defer tx.Rollback(ctx)

	slugs := make([]string, 0, len(projects))

	upsertQuery := `
	INSERT INTO projects (
		id, title, slug, short_description, description, category, tags,
		cover_image, demo_url, github_url, status, featured, order_idx, metrics, updated_at
	) VALUES (
		$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
	)
	ON CONFLICT (slug) DO UPDATE SET
		title = EXCLUDED.title,
		short_description = EXCLUDED.short_description,
		description = EXCLUDED.description,
		category = EXCLUDED.category,
		tags = EXCLUDED.tags,
		cover_image = EXCLUDED.cover_image,
		demo_url = EXCLUDED.demo_url,
		github_url = EXCLUDED.github_url,
		status = EXCLUDED.status,
		featured = EXCLUDED.featured,
		order_idx = EXCLUDED.order_idx,
		metrics = EXCLUDED.metrics,
		updated_at = NOW();
	`

	for _, p := range projects {
		slugs = append(slugs, p.Slug)
		metricsJSON, err := json.Marshal(p.Metrics)
		if err != nil {
			metricsJSON = []byte("{}")
		}

		_, err = tx.Exec(ctx, upsertQuery,
			p.ID, p.Title, p.Slug, p.ShortDescription, p.Description, p.Category,
			p.Tags, p.CoverImage, p.DemoURL, p.GithubURL, p.Status, p.Featured,
			p.Order, metricsJSON,
		)
		if err != nil {
			return fmt.Errorf("falha ao inserir/atualizar projeto %s: %w", p.Slug, err)
		}
	}

	// Remove projetos removidos do YAML se houver algum
	if len(slugs) > 0 {
		deleteQuery := `DELETE FROM projects WHERE slug != ALL($1)`
		if _, err := tx.Exec(ctx, deleteQuery, slugs); err != nil {
			return fmt.Errorf("falha ao limpar projetos antigos: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *PostgresRepository) GetAllProjects(ctx context.Context, category, tag string) ([]domain.Project, error) {
	query := `
	SELECT id, title, slug, short_description, description, category, tags,
	       cover_image, demo_url, github_url, status, featured, order_idx,
	       metrics, views, created_at, updated_at
	FROM projects
	WHERE ($1 = '' OR LOWER(category) LIKE '%' || LOWER($1) || '%')
	  AND ($2 = '' OR $2 = ANY(tags))
	ORDER BY order_idx ASC, id ASC
	`

	rows, err := r.pool.Query(ctx, query, category, tag)
	if err != nil {
		return nil, fmt.Errorf("falha ao consultar projetos: %w", err)
	}
	defer rows.Close()

	projects := make([]domain.Project, 0)
	for rows.Next() {
		var p domain.Project
		var metricsRaw []byte

		err := rows.Scan(
			&p.ID, &p.Title, &p.Slug, &p.ShortDescription, &p.Description,
			&p.Category, &p.Tags, &p.CoverImage, &p.DemoURL, &p.GithubURL,
			&p.Status, &p.Featured, &p.Order, &metricsRaw, &p.Views,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("falha ao ler linha de projeto: %w", err)
		}

		if len(metricsRaw) > 0 {
			_ = json.Unmarshal(metricsRaw, &p.Metrics)
		}
		if p.Metrics == nil {
			p.Metrics = make(map[string]string)
		}
		if p.Tags == nil {
			p.Tags = []string{}
		}

		projects = append(projects, p)
	}

	return projects, rows.Err()
}

func (r *PostgresRepository) GetProjectBySlug(ctx context.Context, slug string) (*domain.Project, error) {
	query := `
	SELECT id, title, slug, short_description, description, category, tags,
	       cover_image, demo_url, github_url, status, featured, order_idx,
	       metrics, views, created_at, updated_at
	FROM projects
	WHERE slug = $1
	`

	var p domain.Project
	var metricsRaw []byte

	err := r.pool.QueryRow(ctx, query, slug).Scan(
		&p.ID, &p.Title, &p.Slug, &p.ShortDescription, &p.Description,
		&p.Category, &p.Tags, &p.CoverImage, &p.DemoURL, &p.GithubURL,
		&p.Status, &p.Featured, &p.Order, &metricsRaw, &p.Views,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrProjectNotFound
		}
		return nil, fmt.Errorf("falha ao buscar projeto: %w", err)
	}

	if len(metricsRaw) > 0 {
		_ = json.Unmarshal(metricsRaw, &p.Metrics)
	}
	if p.Metrics == nil {
		p.Metrics = make(map[string]string)
	}
	if p.Tags == nil {
		p.Tags = []string{}
	}

	return &p, nil
}

func (r *PostgresRepository) IncrementProjectViews(ctx context.Context, slug string) (int64, error) {
	query := `
	UPDATE projects
	SET views = views + 1
	WHERE slug = $1
	RETURNING views
	`
	var newViews int64
	err := r.pool.QueryRow(ctx, query, slug).Scan(&newViews)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, domain.ErrProjectNotFound
		}
		return 0, fmt.Errorf("falha ao incrementar visualizações: %w", err)
	}
	return newViews, nil
}

func (r *PostgresRepository) SaveContactMessage(ctx context.Context, msg *domain.ContactMessage) error {
	query := `
	INSERT INTO contact_messages (name, email, subject, message, created_at)
	VALUES ($1, $2, $3, $4, NOW())
	RETURNING id, created_at
	`
	return r.pool.QueryRow(ctx, query, msg.Name, msg.Email, msg.Subject, msg.Message).
		Scan(&msg.ID, &msg.CreatedAt)
}

func (r *PostgresRepository) GetContactMessages(ctx context.Context) ([]domain.ContactMessage, error) {
	query := `
	SELECT id, name, email, subject, message, read, created_at
	FROM contact_messages
	ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("falha ao consultar mensagens: %w", err)
	}
	defer rows.Close()

	messages := make([]domain.ContactMessage, 0)
	for rows.Next() {
		var m domain.ContactMessage
		if err := rows.Scan(&m.ID, &m.Name, &m.Email, &m.Subject, &m.Message, &m.Read, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("falha ao ler mensagem: %w", err)
		}
		messages = append(messages, m)
	}
	return messages, rows.Err()
}

func (r *PostgresRepository) GetStats(ctx context.Context) (*domain.Stats, error) {
	stats := &domain.Stats{
		Categories: []string{},
	}

	query := `
	SELECT 
		COUNT(*),
		COALESCE(SUM(views), 0)
	FROM projects
	`
	if err := r.pool.QueryRow(ctx, query).Scan(&stats.TotalProjects, &stats.TotalViews); err != nil {
		return nil, fmt.Errorf("falha ao obter estatísticas de projetos: %w", err)
	}

	queryMsg := `SELECT COUNT(*) FROM contact_messages`
	if err := r.pool.QueryRow(ctx, queryMsg).Scan(&stats.TotalMessages); err != nil {
		return nil, fmt.Errorf("falha ao obter contagem de mensagens: %w", err)
	}

	queryCats := `
	SELECT DISTINCT category
	FROM projects
	WHERE category IS NOT NULL AND category != ''
	ORDER BY category ASC
	`
	rows, err := r.pool.Query(ctx, queryCats)
	if err != nil {
		return nil, fmt.Errorf("falha ao obter categorias: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var cat string
		if err := rows.Scan(&cat); err == nil {
			stats.Categories = append(stats.Categories, cat)
		}
	}

	return stats, nil
}

func (r *PostgresRepository) Ping(ctx context.Context) error {
	return r.pool.Ping(ctx)
}

func (r *PostgresRepository) Close() error {
	r.pool.Close()
	return nil
}
