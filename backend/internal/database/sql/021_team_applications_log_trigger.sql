-- 021_team_applications_log_trigger.sql

CREATE OR REPLACE FUNCTION log_team_application_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'approved' THEN
            IF NEW.reviewed_by_id IS NOT NULL THEN
                INSERT INTO admin_logs (admin_id, action_type, target_user_id, created_at)
                VALUES (NEW.reviewed_by_id, 'approve_team', NEW.applied_by_id, NOW());
            END IF;
        ELSIF NEW.status = 'rejected' THEN
            IF NEW.reviewed_by_id IS NOT NULL THEN
                INSERT INTO admin_logs (admin_id, action_type, reason, target_user_id, created_at)
                VALUES (NEW.reviewed_by_id, 'reject_team', NEW.rejection_reason, NEW.applied_by_id, NOW());
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_team_application_changes ON team_applications;

CREATE TRIGGER trigger_log_team_application_changes
AFTER UPDATE ON team_applications
FOR EACH ROW
EXECUTE FUNCTION log_team_application_changes();
