-- ======================================================
-- FIDYAH VOUCHER SYSTEM — DATABASE SCHEMA
-- Run this file once in your PostgreSQL database (fidyah_db)
-- ======================================================

-- Users table (beneficiaries receiving fidyah vouchers)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  nric        VARCHAR(20)  UNIQUE,
  phone       VARCHAR(20),
  address     TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Merchants table (shops authorized to accept fidyah vouchers)
CREATE TABLE IF NOT EXISTS merchants (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  business_name   VARCHAR(255) NOT NULL,
  uen             VARCHAR(50) UNIQUE,
  address         TEXT,
  bank_account    VARCHAR(50),
  is_approved     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Admins table (MUIS staff)
CREATE TABLE IF NOT EXISTS admins (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Voucher campaigns (e.g. "Ramadan 2026 Fidyah Distribution")
CREATE TABLE IF NOT EXISTS campaigns (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Vouchers table (each row is one physical or digital voucher)
CREATE TABLE IF NOT EXISTS vouchers (
  id              SERIAL PRIMARY KEY,
  campaign_id     INT REFERENCES campaigns(id),
  user_id         INT REFERENCES users(id),
  merchant_id     INT REFERENCES merchants(id) NULL,
  amount          DECIMAL(10,2) NOT NULL,
  signed_payload  TEXT UNIQUE NOT NULL,
  is_redeemed     BOOLEAN DEFAULT FALSE,
  is_physical     BOOLEAN DEFAULT FALSE,
  is_voided       BOOLEAN DEFAULT FALSE,
  redeemed_at     TIMESTAMP NULL,
  issued_at       TIMESTAMP DEFAULT NOW()
);

-- Ledger table (financial record of each redemption for payout)
CREATE TABLE IF NOT EXISTS ledger (
  id              SERIAL PRIMARY KEY,
  voucher_id      INT REFERENCES vouchers(id),
  merchant_id     INT REFERENCES merchants(id),
  amount          DECIMAL(10,2) NOT NULL,
  is_paid_out     BOOLEAN DEFAULT FALSE,
  paid_out_at     TIMESTAMP NULL,
  transaction_at  TIMESTAMP DEFAULT NOW()
);

-- ======================================================
-- SEED DATA — for local testing
-- ======================================================
INSERT INTO admins (email, password, name)
VALUES ('admin@muis.gov.sg', '$2a$10$Rl8Qq.X0EBDYuSh6O2Pj3.NI1VGFQlRZwN1DxiVCq0b1Q2Y3z4W3a', 'MUIS Admin')
ON CONFLICT DO NOTHING;
-- password is: admin123

INSERT INTO campaigns (name, description)
VALUES ('Ramadan 2026 Fidyah Distribution', 'Official MUIS Fidyah vouchers for Ramadan 2026')
ON CONFLICT DO NOTHING;
