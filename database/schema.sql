-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'patient',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_user_name
        CHECK (LENGTH(TRIM(name)) > 0),

    CONSTRAINT valid_user_role
        CHECK (role IN ('patient', 'doctor', 'admin'))
);

-- Existing databases receive the role column as well.
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'patient';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_user_role'
    ) THEN
        ALTER TABLE app_users
        ADD CONSTRAINT valid_user_role
        CHECK (role IN ('patient', 'doctor', 'admin'));
    END IF;
END $$;


-- 2. UNIQUE EMAIL INDEX

CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_unique
ON app_users (LOWER(email));


-- 3. GLUCOSE READINGS TABLE
CREATE TABLE IF NOT EXISTS glucose_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    reading_date DATE NOT NULL,

    slot VARCHAR(30) NOT NULL,

    value_mg_dl INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),


    -- Relationship with app_users

    CONSTRAINT fk_reading_user
        FOREIGN KEY (user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE,


    -- Glucose validation

    CONSTRAINT valid_glucose_value
        CHECK (value_mg_dl BETWEEN 40 AND 600),


    -- Only four allowed reading slots

    CONSTRAINT valid_reading_slot
        CHECK (
            slot IN (
                'Morning',
                'After breakfast',
                'After lunch',
                'After dinner'
            )
        ),


    -- One reading per slot per user per day

    CONSTRAINT unique_user_daily_slot
        UNIQUE (user_id, reading_date, slot)
);


-- 4. INDEX FOR FASTER USER DATE QUERIES

CREATE INDEX IF NOT EXISTS idx_readings_user_date
ON glucose_readings (user_id, reading_date);


-- 5. DOCTOR-PATIENT RELATIONSHIPS
CREATE TABLE IF NOT EXISTS doctor_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    doctor_id UUID NOT NULL
        REFERENCES app_users(id) ON DELETE CASCADE,

    patient_id UUID NOT NULL
        REFERENCES app_users(id) ON DELETE CASCADE,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_relationship_status
        CHECK (status IN ('pending', 'accepted', 'rejected')),

    CONSTRAINT unique_doctor_patient
        UNIQUE (doctor_id, patient_id),

    CONSTRAINT different_users
        CHECK (doctor_id <> patient_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_patients_patient
ON doctor_patients (patient_id, status);

