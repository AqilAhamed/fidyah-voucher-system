-- Vouchers System Database Schema for Supabase

-- Profiles extension table for beneficiaries (mapped to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  nric        VARCHAR(20)  UNIQUE,
  phone       VARCHAR(20),
  address     TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles extension table for merchants (mapped to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.merchants (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  business_name   VARCHAR(255) NOT NULL,
  uen             VARCHAR(50) UNIQUE,
  address         TEXT,
  bank_account    VARCHAR(50),
  is_approved     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voucher campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id              SERIAL PRIMARY KEY,
  campaign_id     INT REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  merchant_id     UUID REFERENCES public.merchants(id) ON DELETE RESTRICT NULL,
  amount          DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  signed_payload  TEXT UNIQUE NOT NULL,
  is_redeemed     BOOLEAN DEFAULT FALSE,
  is_physical     BOOLEAN DEFAULT FALSE,
  is_voided       BOOLEAN DEFAULT FALSE,
  redeemed_at     TIMESTAMP WITH TIME ZONE NULL,
  issued_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ledger table for finance payouts
CREATE TABLE IF NOT EXISTS public.ledger (
  id              SERIAL PRIMARY KEY,
  voucher_id      INT REFERENCES public.vouchers(id) ON DELETE RESTRICT,
  merchant_id     UUID REFERENCES public.merchants(id) ON DELETE RESTRICT,
  amount          DECIMAL(10,2) NOT NULL,
  is_paid_out     BOOLEAN DEFAULT FALSE,
  paid_out_at     TIMESTAMP WITH TIME ZONE NULL,
  transaction_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON public.vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_redeemed ON public.vouchers(is_redeemed) WHERE is_redeemed = FALSE;
CREATE INDEX IF NOT EXISTS idx_ledger_merchant_payout ON public.ledger(merchant_id, is_paid_out);