-- 013_admin_logs.sql
-- AdminLog table migration

CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(20),
    reason TEXT,
    target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_manga_id INTEGER REFERENCES mangas(id) ON DELETE SET NULL,
    target_chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
    target_comment_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action_type ON admin_logs(action_type);
CREATE INDEX idx_admin_logs_target_user_id ON admin_logs(target_user_id);
CREATE INDEX idx_admin_logs_target_manga_id ON admin_logs(target_manga_id);