const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ── POST /api/auth/register/user
router.post('/register/user', async (req, res) => {
  const { email, password, name, nric, phone, address } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required.' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name, nric, phone, address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, email, name',
      [email, hashed, name, nric || null, phone || null, address || null]
    );
    const user = result.rows[0];
    res.status(201).json({ message: 'User registered.', user, token: generateToken(user.id, 'user') });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email or NRIC already registered.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/auth/register/merchant
router.post('/register/merchant', async (req, res) => {
  const { email, password, business_name, uen, address, bank_account } = req.body;
  if (!email || !password || !business_name) {
    return res.status(400).json({ error: 'email, password, and business_name are required.' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO merchants (email, password, business_name, uen, address, bank_account) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, email, business_name, is_approved',
      [email, hashed, business_name, uen || null, address || null, bank_account || null]
    );
    const merchant = result.rows[0];
    res.status(201).json({ message: 'Merchant registered. Awaiting MUIS approval.', merchant, token: generateToken(merchant.id, 'merchant') });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email or UEN already registered.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body; // role: 'user' | 'merchant' | 'admin'
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email, password, and role are required.' });
  }

  const tableMap = { user: 'users', merchant: 'merchants', admin: 'admins' };
  const table = tableMap[role];
  if (!table) return res.status(400).json({ error: 'Invalid role.' });

  try {
    const result = await pool.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });

    const account = result.rows[0];
    const valid = await bcrypt.compare(password, account.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    if (role === 'merchant' && !account.is_approved) {
      return res.status(403).json({ error: 'Your merchant account is pending MUIS approval.' });
    }

    const { password: _pw, ...safeAccount } = account;
    res.json({ message: 'Login successful.', account: safeAccount, token: generateToken(account.id, role) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
