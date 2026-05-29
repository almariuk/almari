ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS buyer_payment_claimed_at TIMESTAMPTZ;
