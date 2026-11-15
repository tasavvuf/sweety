
-- ==========================================
-- SWEETY - REPEATABLE DEMO SEED
-- Run schema.sql before this file.
-- All demo accounts use: SweetyDemo2026!
-- ==========================================

BEGIN;

-- 1. Demo accounts
-- The bcrypt hash was generated with the server's bcrypt package.
INSERT INTO app_users (name, email, password_hash, role)
VALUES
    (
        'John Doe',
        'demo@sweety.com',
        '$2b$10$B1qyHzgJ0SkQ4nlHis5uw.r9xkvOcCfqbe0e08MjD1CVo6/PP7MsG',
        'patient'
    ),
    (
        'Mina Lee',
        'mina@sweety.demo',
        '$2b$10$B1qyHzgJ0SkQ4nlHis5uw.r9xkvOcCfqbe0e08MjD1CVo6/PP7MsG',
        'patient'
    ),
    (
        'Dr. Joy Rafi',
        'joy.rafi@sweety.demo',
        '$2b$10$B1qyHzgJ0SkQ4nlHis5uw.r9xkvOcCfqbe0e08MjD1CVo6/PP7MsG',
        'doctor'
    ),
    (
        'Dr. Leena Akter',
        'leena.akter@sweety.demo',
        '$2b$10$B1qyHzgJ0SkQ4nlHis5uw.r9xkvOcCfqbe0e08MjD1CVo6/PP7MsG',
        'doctor'
    )
ON CONFLICT ((LOWER(email))) DO UPDATE
SET name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;

-- 2. Doctor-patient access
-- Joy can view John; Leena can view Mina and has a pending request for John.
INSERT INTO doctor_patients (doctor_id, patient_id, status)
SELECT doctor.id, patient.id, relationship.status
FROM (
    VALUES
        ('joy.rafi@sweety.demo', 'demo@sweety.com', 'accepted'),
        ('leena.akter@sweety.demo', 'mina@sweety.demo', 'accepted'),
        ('leena.akter@sweety.demo', 'demo@sweety.com', 'pending')
) AS relationship(doctor_email, patient_email, status)
JOIN app_users AS doctor
    ON LOWER(doctor.email) = LOWER(relationship.doctor_email)
   AND doctor.role = 'doctor'
JOIN app_users AS patient
    ON LOWER(patient.email) = LOWER(relationship.patient_email)
   AND patient.role = 'patient'
ON CONFLICT (doctor_id, patient_id) DO UPDATE
SET status = EXCLUDED.status;

-- 3. Sample readings for both patients
-- Values span this month and the previous month for report comparisons.
WITH patient_profiles(email, baseline) AS (
    VALUES
        ('demo@sweety.com', 96),
        ('mina@sweety.demo', 104)
),
current_days(reading_date, variation) AS (
    SELECT CURRENT_DATE - sample.days_ago, sample.variation
    FROM (VALUES
        (0, 0),
        (1, 3),
        (2, -2),
        (3, 5),
        (7, 1),
        (10, 4),
        (14, -1)
    ) AS sample(days_ago, variation)
),
previous_month_days(reading_date, variation) AS (
    SELECT (
        date_trunc('month', CURRENT_DATE)::date - INTERVAL '1 month'
        + ((sample.day_of_month - 1) * INTERVAL '1 day')
    )::date,
    sample.variation
    FROM (VALUES
        (4, -3),
        (10, 2),
        (17, 0),
        (24, 4)
    ) AS sample(day_of_month, variation)
),
sample_days AS (
    SELECT reading_date, MIN(variation) AS variation
    FROM (
        SELECT reading_date, variation FROM current_days
        UNION ALL
        SELECT reading_date, variation FROM previous_month_days
    ) AS candidates
    GROUP BY reading_date
)
INSERT INTO glucose_readings (user_id, reading_date, slot, value_mg_dl)
SELECT
    patient.id,
    sample_days.reading_date,
    reading_slot.slot,
    patient_profiles.baseline + reading_slot.adjustment + sample_days.variation
FROM patient_profiles
JOIN app_users AS patient
    ON LOWER(patient.email) = LOWER(patient_profiles.email)
   AND patient.role = 'patient'
CROSS JOIN sample_days
CROSS JOIN (VALUES
    ('Morning', 0),
    ('After breakfast', 32),
    ('After lunch', 43),
    ('After dinner', 27)
) AS reading_slot(slot, adjustment)
ON CONFLICT ON CONSTRAINT unique_user_daily_slot DO UPDATE
SET value_mg_dl = EXCLUDED.value_mg_dl,
    updated_at = NOW();

COMMIT;
