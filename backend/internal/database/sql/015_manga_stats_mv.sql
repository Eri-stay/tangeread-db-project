-- 015_manga_stats_mv.sql
-- Materialized view for manga statistics (average rating and count)
-- Create materialized view
DROP MATERIALIZED VIEW IF EXISTS manga_stats_mv CASCADE;

CREATE MATERIALIZED VIEW manga_stats_mv AS
SELECT m.id AS manga_id,
    CAST(COALESCE(AVG(r.score), 0) AS DOUBLE PRECISION) AS avg_rating,
    COUNT(DISTINCT r.user_id) AS rating_count,
    COUNT(DISTINCT c.id) AS chapter_count
FROM mangas m
    LEFT JOIN ratings r ON r.manga_id = m.id
    LEFT JOIN chapters c ON c.manga_id = m.id
    AND c.display_status = 'active'
GROUP BY m.id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_manga_stats_mv_manga_id ON manga_stats_mv (manga_id);
