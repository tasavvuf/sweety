
-- ==========================================
-- SWEETY - DEMO SEED DATA
-- ==========================================

-- 1. Create a demo user
-- This is a database-only demo user.
-- password_hash is a placeholder, not a valid login password hash.

INSERT INTO app_users (name, email, password_hash)
VALUES (
    'John Doe',
    'demo@sweety.com',
    'SEED_USER_NO_LOGIN'
)
ON CONFLICT DO NOTHING;

-- 2. Insert sample glucose readings

INSERT INTO glucose_readings
    (user_id, reading_date, slot, value_mg_dl)

SELECT
    u.id,
    sample.reading_date::DATE,
    sample.slot,
    sample.value_mg_dl
FROM app_users AS u
CROSS JOIN (
    VALUES
        ('2026-11-10', 'Morning', 105),
        ('2026-11-10', 'After breakfast', 145),
        ('2026-11-10', 'After lunch', 160),
        ('2026-11-10', 'After dinner', 135),

        ('2026-11-11', 'Morning', 110),
        ('2026-11-11', 'After breakfast', 150),
        ('2026-11-11', 'After lunch', 170),

        ('2026-11-12', 'Morning', 98),
        ('2026-11-12', 'After breakfast', 140),
        ('2026-11-12', 'After lunch', 155),
        ('2026-11-12', 'After dinner', 130),

        ('2026-11-13', 'Morning', 115),
        ('2026-11-13', 'After breakfast', 165),
        ('2026-11-13', 'After lunch', 180),
        ('2026-11-13', 'After dinner', 145)
) AS sample(reading_date, slot, value_mg_dl)

WHERE LOWER(u.email) = LOWER('demo@sweety.com')

ON CONFLICT ON CONSTRAINT unique_user_daily_slot
DO NOTHING;
