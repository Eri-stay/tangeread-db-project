-- 016_seed_data.sql
-- Seed default data for development

-- Only seed if tables are empty

-- Seed default users (admin, moderators, authors)
-- Passwords are hashed with bcrypt (default cost)
-- admin -> $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- moderator1 -> $2a$10$8sGeFWLMFYqRXmJ7qKqLLeGjKzXQZqKVqKqLLeGjKzXQZqKVqKqLLe
-- author1 -> $2a$10$AaBbCcDdEeFfGgHhIiJjKkGjKzXQZqKVqKqLLeGjKzXQZqKVqKqLLe

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com') THEN
        INSERT INTO users (username, email, password_hash, role) VALUES
        ('admin', 'admin@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
        ('moderator1', 'moderator1@gmail.com', '$2a$10$8sGeFWLMFYqRXmJ7qKqLLeGjKzXQZqKVqKqLLeGjKzXQZqKVqKqLLe', 'moderator'),
        ('moderator2', 'moderator2@gmail.com', '$2a$10$8sGeFWLMFYqRXmJ7qKqLLeGjKzXQZqKVqKqLLeGjKzXQZqKVqKqLLe', 'moderator'),
        ('moderator3', 'moderator3@gmail.com', '$2a$10$8sGeFWLMFYqRXmJ7qKqLLeGjKzXQZqKVqKqLLeGjKzXQZqKVqKqLLe', 'moderator'),
        ('author1', 'author1@gmail.com', '$2a$10$AaBbCcDdEeFfGgHhIiJjKkGjKzXQZqKVqKqLLeGjKzXQZqKVqKqLLe', 'author'),
        ('author2', 'author2@gmail.com', '$2a$10$AaBbCcDdEeFfGgHhIiJjKkGjKzXQZqKVqKqLLeGjKzXQZqKVqKqLLe', 'author'),
        ('author3', 'author3@gmail.com', '$2a$10$AaBbCcDdEeFfGgHhIiJjKkGjKzXQZqKVqKqLLeGjKzXQZqKVqKqLLe', 'author');
    END IF;
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