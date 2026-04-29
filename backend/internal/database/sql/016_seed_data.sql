-- 016_seed_data.sql
-- Seed default data for development

-- Only seed if tables are empty

-- Seed default users (admin, moderators, authors)
-- Passwords are hashed with bcrypt (default cost)
-- admin -> $2a$12$4TI0m2oSKIBC/bNr6F1GwOskpfG9Tld/QsbTbFL50AJGy.RgJTdDq
-- moderator -> $2a$12$iDQsZgEVLi/QFP5f5Hm5IOhY.611B8azujYiVUA2jmsHTaDvvXBqa
-- author -> $2a$12$YoZhAmUDcfM/h25uz11.VOX8Ufv5mjoAgCLxZhkKDoEkgtyX5JY4q

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com') THEN
        INSERT INTO users (username, email, password_hash, role) VALUES
        ('admin', 'admin@gmail.com', '$2a$12$4TI0m2oSKIBC/bNr6F1GwOskpfG9Tld/QsbTbFL50AJGy.RgJTdDq', 'admin'),
        ('moderator', 'moderator1@gmail.com', '$2a$12$iDQsZgEVLi/QFP5f5Hm5IOhY.611B8azujYiVUA2jmsHTaDvvXBqa', 'moderator'),
        ('author', 'author1@gmail.com', '$2a$12$YoZhAmUDcfM/h25uz11.VOX8Ufv5mjoAgCLxZhkKDoEkgtyX5JY4q', 'author'),
END $$;

-- Seed fake mangas
DO $$
DECLARE
    desc1 TEXT := 'Це епічна історія про подорож у невідоме...';
    desc2 TEXT := 'Темне фентезі, де головний герой втрачає все.';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM mangas) THEN
        INSERT INTO mangas (title_ua, description, cover_url, status, display_status, format) VALUES
        ('Початок після кінця', desc1, 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&q=80', 'ongoing', 'active', 'manga'),
        ('Підняття рівня наодинці', desc2, 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80', 'completed', 'active', 'manga'),
        ('Берсерк', desc2, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', 'hiatus', 'active', 'manga'),
        ('Людина-бензопила', desc1, 'https://images.unsplash.com/photo-1604073926896-ce89428b5e59?w=800&q=80', 'ongoing', 'active', 'manga'),
        ('Магічна битва', desc1, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80', 'ongoing', 'active', 'manga');
    END IF;
END $$;