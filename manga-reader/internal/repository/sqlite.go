package repository

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"

	"manga-reader/internal/domain"
)

type SQLiteRepository struct {
	db *sql.DB
}

// NewSQLiteRepository creates and initializes a SQLite connection
func NewSQLiteRepository(dbPath string) (*SQLiteRepository, error) {
	// Ensure parent directory exists
	dir := filepath.Dir(dbPath)
	if dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create db directory: %w", err)
		}
	}

	dsn := fmt.Sprintf("%s?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)", dbPath)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	db.SetMaxOpenConns(1) // SQLite is best with 1 writer or managed pool

	repo := &SQLiteRepository{db: db}
	if err := repo.migrate(context.Background()); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	return repo, nil
}

func (r *SQLiteRepository) migrate(ctx context.Context) error {
	schema := `
	CREATE TABLE IF NOT EXISTS user_library (
		manga_id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		cover_url TEXT NOT NULL,
		status TEXT NOT NULL CHECK(status IN ('reading', 'dropped', 'plan_to_read', 'finished')),
		last_read_chapter_id TEXT DEFAULT '',
		last_read_chapter_num TEXT DEFAULT '',
		last_read_chapter_title TEXT DEFAULT '',
		rating REAL DEFAULT 0,
		notes TEXT DEFAULT '',
		created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_user_library_status ON user_library(status);
	CREATE INDEX IF NOT EXISTS idx_user_library_updated ON user_library(updated_at DESC);
	`
	_, err := r.db.ExecContext(ctx, schema)
	return err
}

func (r *SQLiteRepository) SaveLibraryEntry(ctx context.Context, entry *domain.UserLibraryEntry) error {
	query := `
	INSERT INTO user_library (
		manga_id, title, cover_url, status,
		last_read_chapter_id, last_read_chapter_num, last_read_chapter_title,
		rating, notes, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	ON CONFLICT(manga_id) DO UPDATE SET
		title = excluded.title,
		cover_url = excluded.cover_url,
		status = excluded.status,
		last_read_chapter_id = CASE WHEN excluded.last_read_chapter_id != '' THEN excluded.last_read_chapter_id ELSE user_library.last_read_chapter_id END,
		last_read_chapter_num = CASE WHEN excluded.last_read_chapter_num != '' THEN excluded.last_read_chapter_num ELSE user_library.last_read_chapter_num END,
		last_read_chapter_title = CASE WHEN excluded.last_read_chapter_title != '' THEN excluded.last_read_chapter_title ELSE user_library.last_read_chapter_title END,
		rating = excluded.rating,
		notes = excluded.notes,
		updated_at = CURRENT_TIMESTAMP;
	`

	_, err := r.db.ExecContext(ctx, query,
		entry.MangaID,
		entry.Title,
		entry.CoverURL,
		string(entry.Status),
		entry.LastReadChapterID,
		entry.LastReadChapterNum,
		entry.LastReadChapterTitle,
		entry.Rating,
		entry.Notes,
	)
	return err
}

func (r *SQLiteRepository) GetLibraryEntry(ctx context.Context, mangaID string) (*domain.UserLibraryEntry, error) {
	query := `
	SELECT manga_id, title, cover_url, status,
	       last_read_chapter_id, last_read_chapter_num, last_read_chapter_title,
	       rating, notes, created_at, updated_at
	FROM user_library
	WHERE manga_id = ?;
	`

	row := r.db.QueryRowContext(ctx, query, mangaID)
	var entry domain.UserLibraryEntry
	var statusStr string
	var createdAtStr, updatedAtStr string

	err := row.Scan(
		&entry.MangaID,
		&entry.Title,
		&entry.CoverURL,
		&statusStr,
		&entry.LastReadChapterID,
		&entry.LastReadChapterNum,
		&entry.LastReadChapterTitle,
		&entry.Rating,
		&entry.Notes,
		&createdAtStr,
		&updatedAtStr,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	entry.Status = domain.LibraryStatus(statusStr)
	entry.CreatedAt, _ = parseTime(createdAtStr)
	entry.UpdatedAt, _ = parseTime(updatedAtStr)

	return &entry, nil
}

func (r *SQLiteRepository) ListLibrary(ctx context.Context, status domain.LibraryStatus) ([]*domain.UserLibraryEntry, error) {
	var query string
	var args []interface{}

	if status != "" && status.IsValid() {
		query = `
		SELECT manga_id, title, cover_url, status,
		       last_read_chapter_id, last_read_chapter_num, last_read_chapter_title,
		       rating, notes, created_at, updated_at
		FROM user_library
		WHERE status = ?
		ORDER BY updated_at DESC;
		`
		args = append(args, string(status))
	} else {
		query = `
		SELECT manga_id, title, cover_url, status,
		       last_read_chapter_id, last_read_chapter_num, last_read_chapter_title,
		       rating, notes, created_at, updated_at
		FROM user_library
		ORDER BY updated_at DESC;
		`
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []*domain.UserLibraryEntry
	for rows.Next() {
		var entry domain.UserLibraryEntry
		var statusStr string
		var createdAtStr, updatedAtStr string

		err := rows.Scan(
			&entry.MangaID,
			&entry.Title,
			&entry.CoverURL,
			&statusStr,
			&entry.LastReadChapterID,
			&entry.LastReadChapterNum,
			&entry.LastReadChapterTitle,
			&entry.Rating,
			&entry.Notes,
			&createdAtStr,
			&updatedAtStr,
		)
		if err != nil {
			return nil, err
		}

		entry.Status = domain.LibraryStatus(statusStr)
		entry.CreatedAt, _ = parseTime(createdAtStr)
		entry.UpdatedAt, _ = parseTime(updatedAtStr)
		entries = append(entries, &entry)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return entries, nil
}

func (r *SQLiteRepository) DeleteLibraryEntry(ctx context.Context, mangaID string) error {
	query := `DELETE FROM user_library WHERE manga_id = ?;`
	_, err := r.db.ExecContext(ctx, query, mangaID)
	return err
}

func (r *SQLiteRepository) UpdateReadingProgress(ctx context.Context, mangaID, chapterID, chapterNum, chapterTitle string) error {
	// Update progress if exists; if entry doesn't exist, ignore or default to reading
	query := `
	UPDATE user_library
	SET last_read_chapter_id = ?,
	    last_read_chapter_num = ?,
	    last_read_chapter_title = ?,
	    updated_at = CURRENT_TIMESTAMP
	WHERE manga_id = ?;
	`
	res, err := r.db.ExecContext(ctx, query, chapterID, chapterNum, chapterTitle, mangaID)
	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		// Entry not in library yet, insert as reading
		insertQuery := `
		INSERT INTO user_library (
			manga_id, title, cover_url, status,
			last_read_chapter_id, last_read_chapter_num, last_read_chapter_title,
			created_at, updated_at
		) VALUES (?, ?, '', 'reading', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
		`
		_, err = r.db.ExecContext(ctx, insertQuery, mangaID, "Manga "+mangaID[:8], chapterID, chapterNum, chapterTitle)
	}

	return err
}

func (r *SQLiteRepository) GetLibraryStats(ctx context.Context) (*domain.LibraryStats, error) {
	query := `SELECT status, COUNT(*) FROM user_library GROUP BY status;`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := &domain.LibraryStats{}
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		stats.Total += count
		switch domain.LibraryStatus(status) {
		case domain.StatusReading:
			stats.Reading = count
		case domain.StatusPlanToRead:
			stats.PlanToRead = count
		case domain.StatusFinished:
			stats.Finished = count
		case domain.StatusDropped:
			stats.Dropped = count
		}
	}

	return stats, nil
}

func (r *SQLiteRepository) Close() error {
	return r.db.Close()
}

func parseTime(val string) (time.Time, error) {
	layouts := []string{
		"2006-01-02 15:04:05",
		time.RFC3339,
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, val); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse time: %s", val)
}
