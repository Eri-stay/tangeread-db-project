-- 006_mangas.sql
-- Manga table migration

CREATE TABLE IF NOT EXISTS mangas (
    id SERIAL PRIMARY KEY,
    title_ua VARCHAR(500) NOT NULL,
    title_orig VARCHAR(500),
    description TEXT,
    cover_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ongoing',
    format VARCHAR(20) NOT NULL,
    release_year INTEGER,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    display_status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE INDEX idx_mangas_title_ua ON mangas(title_ua);
CREATE INDEX idx_mangas_status ON mangas(status);
CREATE INDEX idx_mangas_display_status ON mangas(display_status);
CREATE INDEX idx_mangas_team_id ON mangas(team_id);