-- 007_manga_tags.sql
-- manga_tags join table for many-to-many relationship

CREATE TABLE IF NOT EXISTS manga_tags (
    manga_id INTEGER NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (manga_id, tag_id)
);

CREATE INDEX idx_manga_tags_tag_id ON manga_tags(tag_id);