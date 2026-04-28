-- 011_ratings.sql
-- Rating table migration (composite primary key with check constraint)

CREATE TABLE IF NOT EXISTS ratings (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id)
);

CREATE INDEX idx_ratings_manga_id ON ratings(manga_id);