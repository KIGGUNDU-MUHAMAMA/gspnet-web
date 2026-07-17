-- ============================================================
--  GSP.NET — Mapillary Upload Sessions (Evidence Chain)
--  Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Drop and recreate cleanly (safe — no images stored here)
DROP TABLE IF EXISTS mapillary_upload_sessions;

CREATE TABLE mapillary_upload_sessions (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Unique resumable-upload session key (becomes the zip filename on Mapillary)
    session_key           TEXT        NOT NULL UNIQUE,

    -- Session summary
    image_count           INTEGER     NOT NULL DEFAULT 0,
    status                TEXT        NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending','uploading','complete','failed')),

    -- GPS bounding box of the capture route (first & last frame)
    gps_start_lat         FLOAT8,
    gps_start_lon         FLOAT8,
    gps_end_lat           FLOAT8,
    gps_end_lon           FLOAT8,

    -- Court evidence: one row per image {filename, sha256, lat, lon, timestamp_utc}
    -- No image binary stored — just the hash for tamper detection
    image_hashes          JSONB       NOT NULL DEFAULT '[]'::jsonb,

    -- Mapillary reference
    mapillary_session_key TEXT,

    -- Error details if status = 'failed'
    error_message         TEXT,

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at          TIMESTAMPTZ
);

-- Index for fast per-user lookups
CREATE INDEX idx_mly_sessions_user ON mapillary_upload_sessions(user_id, created_at DESC);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE mapillary_upload_sessions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own sessions
CREATE POLICY "mly_insert_own"
    ON mapillary_upload_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can read their own sessions
CREATE POLICY "mly_select_own"
    ON mapillary_upload_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own sessions (status, completed_at, error_message)
CREATE POLICY "mly_update_own"
    ON mapillary_upload_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can read all sessions (for platform oversight / court disclosure)
CREATE POLICY "mly_admin_select_all"
    ON mapillary_upload_sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'rsu')
        )
    );
