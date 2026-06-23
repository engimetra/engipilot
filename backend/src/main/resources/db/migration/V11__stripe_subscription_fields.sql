ALTER TABLE organisations
    ADD COLUMN IF NOT EXISTS stripe_customer_id      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS stripe_subscription_id  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS subscription_expires_at DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organisations_stripe_customer
    ON organisations (stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organisations_stripe_subscription
    ON organisations (stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;
