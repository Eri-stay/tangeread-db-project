-- 019_prevent_comment_spam_trigger.sql

CREATE OR REPLACE FUNCTION prevent_comment_spam()
RETURNS TRIGGER AS $$
DECLARE
    recent_comments_count INT;
BEGIN
    SELECT COUNT(*) INTO recent_comments_count
    FROM comments
    WHERE user_id = NEW.user_id AND created_at > NOW() - INTERVAL '1 minute';

    IF recent_comments_count >= 5 THEN
        RAISE EXCEPTION 'Most likely spam. Ban?';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_comment_spam ON comments;

CREATE TRIGGER trigger_prevent_comment_spam
BEFORE INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION prevent_comment_spam();
