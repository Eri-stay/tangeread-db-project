-- 009_reading_histories.sql
-- ReadingHistories table migration (composite primary key)
CREATE TABLE IF NOT EXISTS reading_histories (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id)
);

CREATE INDEX idx_reading_histories_manga_id ON reading_histories(manga_id);

CREATE INDEX idx_reading_histories_chapter_id ON reading_histories(chapter_id);
