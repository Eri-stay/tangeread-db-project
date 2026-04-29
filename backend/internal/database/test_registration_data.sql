-- Test data for registration stats query (last 6 months)
-- This data tests the GetRegistrationStats handler

-- November 2025 (4 users)
INSERT INTO users (username, email, password_hash, role, is_banned, deleted_at, created_at, updated_at)
VALUES 
  ('user_nov_1', 'reader1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2025-11-05 10:30:00'::timestamp, NOW()),
  ('user_nov_2', 'reader2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2025-11-12 14:15:00'::timestamp, NOW()),
  ('user_nov_3', 'author1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'author', FALSE, NULL, '2025-11-18 09:45:00'::timestamp, NOW()),
  ('user_nov_4', 'reader3@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2025-11-28 16:20:00'::timestamp, NOW()),

-- December 2025 (5 users)
  ('user_dec_1', 'reader4@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2025-12-02 11:00:00'::timestamp, NOW()),
  ('user_dec_2', 'author2@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'author', FALSE, NULL, '2025-12-08 13:30:00'::timestamp, NOW()),
  ('user_dec_3', 'reader5@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2025-12-15 15:45:00'::timestamp, NOW()),
  ('user_dec_4', 'reader6@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2025-12-22 10:15:00'::timestamp, NOW()),
  ('user_dec_5', 'author3@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'author', FALSE, NULL, '2025-12-29 08:00:00'::timestamp, NOW()),

-- January 2026 (4 users)
  ('user_jan_1', 'reader7@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2026-01-05 12:30:00'::timestamp, NOW()),
  ('user_jan_2', 'reader8@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2026-01-12 14:00:00'::timestamp, NOW()),
  ('user_jan_3', 'author4@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'author', FALSE, NULL, '2026-01-20 09:15:00'::timestamp, NOW()),
  ('user_jan_4', 'reader9@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2026-01-28 17:45:00'::timestamp, NOW()),

-- February 2026 (3 users)
  ('user_feb_1', 'reader10@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2026-02-03 10:30:00'::timestamp, NOW()),
  ('user_feb_2', 'author5@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'author', FALSE, NULL, '2026-02-14 11:20:00'::timestamp, NOW()),
  ('user_feb_3', 'reader11@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2026-02-25 15:00:00'::timestamp, NOW()),

-- March 2026 (4 users)
  ('user_mar_1', 'reader12@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2026-03-02 13:45:00'::timestamp, NOW()),
  ('user_mar_2', 'author6@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'author', FALSE, NULL, '2026-03-10 09:30:00'::timestamp, NOW()),
  ('user_mar_3', 'reader13@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2026-03-18 16:15:00'::timestamp, NOW()),
  ('user_mar_4', 'reader14@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2026-03-28 12:00:00'::timestamp, NOW()),

-- April 2026 (2 users so far this month)
  ('user_apr_1', 'reader15@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'reader', FALSE, NULL, '2026-04-05 10:20:00'::timestamp, NOW()),
  ('user_apr_2', 'author7@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG2', 'author', FALSE, NULL, '2026-04-15 14:30:00'::timestamp, NOW());

-- Test the query to verify
-- SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as count
-- FROM users
-- WHERE created_at > NOW() - INTERVAL '6 months'
-- AND is_banned = FALSE AND deleted_at IS NULL
-- GROUP BY TO_CHAR(created_at, 'YYYY-MM'), TO_CHAR(created_at, 'Mon')
-- ORDER BY MIN(created_at);
