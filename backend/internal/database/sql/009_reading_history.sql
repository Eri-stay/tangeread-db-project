-- 009_reading_history.sql
-- ReadingHistory table migration (composite primary key)

CREATE TABLE IF NOT EXISTS reading_history (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, manga_id)
);

CREATE INDEX idx_reading_history_manga_id ON reading_history(manga_id);
CREATE INDEX idx_reading_history_chapter_id ON reading_history(chapter_id);