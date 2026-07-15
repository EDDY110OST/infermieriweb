-- Autenticazione a due fattori (TOTP) per gli account del pannello/admin
ALTER TABLE professional_users ADD COLUMN IF NOT EXISTS totp_secret TEXT NOT NULL DEFAULT '';
ALTER TABLE professional_users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE professional_users ADD COLUMN IF NOT EXISTS totp_pending TEXT NOT NULL DEFAULT '';
