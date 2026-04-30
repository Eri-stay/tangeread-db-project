-- 018_protect_admins_trigger.sql
-- Prevent hard and soft deletion of administrators

CREATE OR REPLACE FUNCTION protect_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent Hard Delete
    IF TG_OP = 'DELETE' THEN
        IF OLD.role = 'admin' THEN
            RAISE EXCEPTION 'Deletion of administrator accounts is strictly prohibited.';
        END IF;
        RETURN OLD;
    END IF;

    -- Prevent Soft Delete (GORM sets deleted_at via UPDATE)
    IF TG_OP = 'UPDATE' THEN
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            IF OLD.role = 'admin' THEN
                RAISE EXCEPTION 'Soft deletion of administrator accounts is strictly prohibited.';
            END IF;
        END IF;

        -- Prevent changing ID or role of the primary admin (id=1)
        IF OLD.id = 1 THEN
            IF NEW.id != 1 THEN
                RAISE EXCEPTION 'Changing the ID of the primary administrator (id=1) is strictly prohibited.';
            END IF;
            IF NEW.role != 'admin' THEN
                RAISE EXCEPTION 'Changing the role of the primary administrator (id=1) is strictly prohibited.';
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_admin_deletion ON users;

CREATE TRIGGER trg_protect_admin_deletion
BEFORE DELETE OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION protect_admin_deletion();
