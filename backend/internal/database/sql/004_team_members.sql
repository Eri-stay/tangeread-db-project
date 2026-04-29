-- 004_team_members.sql
-- TeamMember table migration (composite primary key)

CREATE TABLE IF NOT EXISTS team_members (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    internal_role VARCHAR(20) NOT NULL
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);