# Fidyah Voucher System
**MUIS Digital Fidyah Voucher Platform**

A full-stack digital voucher system for MUIS fidyah distribution, modelled after Singapore's CDC/RedeemSG architecture.

---

## Project Overview

| Component           | Technology       | Who Builds It |
|---------------------|------------------|---------------|
| Backend API         | Node.js + Express + PostgreSQL | You |
| Admin Web Dashboard | React.js         | Your friend   |
| User Mobile App     | React Native (Expo) | Your friend |
| Merchant Mobile App | React Native (Expo) | Your friend |

---

## Project Structure

```
fidyah_project/
├── backend/                 ← Node.js API (you)
│   ├── server.js            ← Main Express server
│   ├── db.js                ← PostgreSQL connection pool
│   ├── cryptoHelper.js      ← HMAC-SHA256 QR signature logic
│   ├── schema.sql           ← Run this once to create DB tables
│   ├── .env                 ← Your secrets (never commit this!)
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js          ← JWT verification + role guard
│   └── routes/
│       ├── auth.js          ← Login/Register endpoints
│       ├── vouchers.js      ← User voucher endpoints
│       ├── merchant.js      ← Merchant scan/redeem endpoints
│       └── admin.js         ← MUIS admin endpoints + PDF generator
│
├── admin-dashboard/         ← React.js web admin portal (friend)
│   ├── src/
│   │   ├── App.js           ← Router
│   │   ├── styles.css       ← All styles
│   │   ├── api/api.js       ← All API calls
│   │   ├── components/Layout.js
│   │   └── pages/
│   │       ├── LoginPage.js
│   │       ├── Dashboard.js
│   │       ├── UsersPage.js    ← Issue vouchers here
│   │       ├── MerchantsPage.js ← Approve merchants here
│   │       └── LedgerPage.js   ← Track & settle payouts
│   └── package.json
│
├── user-app/                ← React Native user app (friend)
│   ├── App.js               ← Navigation setup
│   ├── src/
│   │   ├── api/api.js
│   │   └── screens/
│   │       ├── LoginScreen.js
│   │       ├── RegisterScreen.js
│   │       └── WalletScreen.js  ← Displays QR codes
│   └── package.json
│
└── merchant-app/            ← React Native merchant scanner (friend)
    ├── App.js               ← Navigation setup
    ├── src/
    │   ├── api/api.js
    │   └── screens/
    │       ├── LoginScreen.js
    │       └── ScannerScreen.js ← Camera QR scanner
    └── package.json
```

---

## Setup Instructions (Run Once)

### 1. PostgreSQL Setup
1. Install PostgreSQL and create the database:
   ```sql
   CREATE DATABASE fidyah_db;
   ```
2. Open `fidyah_db` and run the full contents of `backend/schema.sql`.

### 2. Backend Setup (Your job)
```bash
cd fidyah_project/backend
npm install
```
Edit `.env` — update `DB_PASSWORD` to your PostgreSQL password.
```bash
node server.js
```
✅ Server starts at http://localhost:5000

### 3. Admin Dashboard Setup (Friend's job)
```bash
cd fidyah_project/admin-dashboard
npm install
npm start
```
✅ Dashboard opens at http://localhost:3000

Default login: `admin@muis.gov.sg` / `admin123`

### 4. Mobile Apps Setup (Friend's job)
Install Expo CLI: `npm install -g expo-cli`

**User App:**
```bash
cd fidyah_project/user-app
npm install
expo start
```
**Merchant App:**
```bash
cd fidyah_project/merchant-app
npm install
expo start
```
Scan the Expo QR code with the Expo Go app on your phone.

> ⚠️ When testing on a real phone, change `localhost` in both
> `user-app/src/api/api.js` and `merchant-app/src/api/api.js`
> to your PC's LAN IP address (e.g., `http://192.168.1.15:5000`).
> Find your IP: Windows → `ipconfig`, Mac/Linux → `ifconfig`

---

## API Reference

### Auth
| Method | Endpoint | Body | Role |
|--------|----------|------|------|
| POST | `/api/auth/login` | `{email, password, role}` | all |
| POST | `/api/auth/register/user` | `{email, password, name, nric?, phone?}` | public |
| POST | `/api/auth/register/merchant` | `{email, password, business_name, uen?}` | public |

### User (requires user JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vouchers` | Get all vouchers for logged-in user |

### Merchant (requires merchant JWT)
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/merchant/redeem` | `{qr_payload}` | Redeem a scanned voucher |
| GET | `/api/merchant/ledger` | — | View own payout summary |

### Admin (requires admin JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard overview numbers |
| GET | `/api/admin/users` | All beneficiaries |
| GET | `/api/admin/merchants` | All merchants |
| PATCH | `/api/admin/merchants/:id/approve` | Approve/suspend merchant |
| POST | `/api/admin/issue-voucher` | Issue single voucher to user |
| POST | `/api/admin/issue-bulk` | Issue vouchers to multiple users |
| PATCH | `/api/admin/vouchers/:id/void` | Void a lost/stolen voucher |
| GET | `/api/admin/ledger` | Full merchant payout ledger |
| PATCH | `/api/admin/ledger/merchant/:id/payout` | Mark merchant as paid |
| GET | `/api/admin/generate-pdf/:campaign_id` | Download PDF of physical vouchers |

---

## Security Architecture

### How QR Code Forgery is Prevented
1. The backend generates a payload: `{v_id, u_id, amt, iss}`
2. It signs it with HMAC-SHA256 using a secret key only the server knows
3. The QR code stores: `base64(payload).base64(signature)`
4. A standard phone camera just sees gibberish text — not a URL
5. When the Merchant App sends it to the backend:
   - The backend recalculates the expected signature
   - Uses `crypto.timingSafeEqual()` to prevent timing attacks
   - If signatures don't match → Rejected as forged

### How Double-Spending is Prevented
- The `POST /api/merchant/redeem` endpoint uses a PostgreSQL `BEGIN`/`FOR UPDATE`/`COMMIT` transaction
- `FOR UPDATE` places an exclusive row-level lock on the voucher
- Any duplicate simultaneous request is queued by PostgreSQL
- Once the first transaction commits, the second reads `is_redeemed = TRUE` and is rejected

---

## Upgrade Path (When Ready to Deploy)
1. Move backend to AWS EC2 or Railway.app
2. Move PostgreSQL to AWS RDS or Supabase
3. Update `.env` with production secrets + rotate SECRET_KEY
4. Add HTTPS via Nginx + Let's Encrypt
5. Replace the simple email/password auth with Singpass OIDC
6. Submit mobile apps to App Store / Play Store
