CREATE OR REPLACE FUNCTION log_user_ban_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Detect when is_banned changes
    IF OLD.is_banned IS DISTINCT FROM NEW.is_banned THEN
        IF NEW.is_banned = TRUE THEN
            -- User is being banned
            INSERT INTO admin_logs (admin_id, action_type, reason, target_user_id, created_at)
            VALUES (NEW.banned_by_id, 'ban_user', NEW.ban_reason, NEW.id, NOW());
        ELSE
            -- User is being unbanned
            -- The handler sets banned_by_id temporarily to the admin unbanning them
            INSERT INTO admin_logs (admin_id, action_type, reason, target_user_id, created_at)
            VALUES (NEW.banned_by_id, 'unban_user', 'Ban removed', NEW.id, NOW());
            
            -- Clear the ban fields so they don't persist
            NEW.banned_by_id = NULL;
            NEW.ban_reason = NULL;
            NEW.ban_expires_at = NULL;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_user_ban_changes ON users;
CREATE TRIGGER trigger_log_user_ban_changes
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION log_user_ban_changes();
