ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS reset_token       VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
