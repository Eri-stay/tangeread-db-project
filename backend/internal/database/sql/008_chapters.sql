-- 008_chapters.sql
-- Chapter table migration

CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    volume INTEGER,
    chapter_number NUMERIC(6,2) NOT NULL,
    title VARCHAR(500),
    uploader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    display_status VARCHAR(20) NOT NULL DEFAULT 'active',
    view_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    pages_url TEXT NOT NULL,
    UNIQUE (manga_id, chapter_number)
);

CREATE INDEX idx_chapters_manga_id ON chapters(manga_id);