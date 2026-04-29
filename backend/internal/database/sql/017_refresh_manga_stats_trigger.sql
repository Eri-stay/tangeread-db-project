-- 017_refresh_manga_stats_trigger.sql
-- Function and triggers to refresh manga_stats_mv automatically

CREATE OR REPLACE FUNCTION refresh_manga_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- CONCURRENTLY allows reading while refreshing, but requires a unique index
    REFRESH MATERIALIZED VIEW CONCURRENTLY manga_stats_mv;
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    -- If CONCURRENTLY fails (e.g. unique index issue), log it but don't fail the transaction
    RAISE WARNING 'Could not refresh manga_stats_mv concurrently: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ratings changes
DROP TRIGGER IF EXISTS trg_refresh_manga_stats_on_ratings ON ratings;
CREATE TRIGGER trg_refresh_manga_stats_on_ratings
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_manga_stats();

-- Trigger for chapters changes
DROP TRIGGER IF EXISTS trg_refresh_manga_stats_on_chapters ON chapters;
CREATE TRIGGER trg_refresh_manga_stats_on_chapters
AFTER INSERT OR UPDATE OR DELETE ON chapters
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_manga_stats();
