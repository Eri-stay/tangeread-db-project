-- 014_extensions_indices.sql
-- PostgreSQL extensions and additional indices

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indices for trigram fuzzy search on manga titles
CREATE INDEX IF NOT EXISTS idx_mangas_title_ua_trgm ON mangas USING gin (title_ua gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_mangas_title_orig_trgm ON mangas USING gin (title_orig gin_trgm_ops);

-- B-Tree indices for frequently sorted/filtered fields
CREATE INDEX IF NOT EXISTS idx_mangas_status ON mangas (status);

CREATE INDEX IF NOT EXISTS idx_mangas_display_status ON mangas (display_status);