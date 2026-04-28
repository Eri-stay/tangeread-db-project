-- 010_user_manga_status.sql
-- UserMangaStatus table migration (composite primary key)

CREATE TABLE IF NOT EXISTS user_manga_statuses (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id)
);

CREATE INDEX idx_user_manga_statuses_manga_id ON user_manga_statuses(manga_id);