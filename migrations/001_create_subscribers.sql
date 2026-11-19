BEGIN;

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL,
  source VARCHAR(40) NOT NULL,
  marketing_consent BOOLEAN NOT NULL,
  consent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  crm_sync_status VARCHAR(20) NOT NULL DEFAULT 'not_requested',
  crm_synced_at TIMESTAMPTZ,
  CONSTRAINT subscribers_email_normalized CHECK (email = LOWER(BTRIM(email))),
  CONSTRAINT subscribers_marketing_consent_required CHECK (marketing_consent IS TRUE),
  CONSTRAINT subscribers_source_valid CHECK (source IN ('modus_join', 'modus_private_waitlist')),
  CONSTRAINT subscribers_crm_status_valid CHECK (crm_sync_status IN ('not_requested', 'pending', 'synced', 'failed')),
  CONSTRAINT subscribers_email_source_unique UNIQUE (email, source)
);

CREATE INDEX IF NOT EXISTS subscribers_created_at_idx ON subscribers (created_at DESC);
CREATE INDEX IF NOT EXISTS subscribers_crm_sync_status_idx ON subscribers (crm_sync_status) WHERE crm_sync_status <> 'not_requested';

COMMIT;
