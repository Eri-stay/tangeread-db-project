-- 005_tags.sql
-- Tag table migration

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name_uk VARCHAR(255) NOT NULL UNIQUE,
    name_en VARCHAR(255) NOT NULL UNIQUE
);

CREATE INDEX idx_tags_name_uk ON tags(name_uk);
CREATE INDEX idx_tags_name_en ON tags(name_en);