const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ── GET /api/vouchers — Get logged-in user's vouchers
router.get('/', authenticateToken, requireRole('user'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.amount, v.signed_payload, v.is_redeemed, v.is_voided, v.issued_at, v.redeemed_at,
              c.name AS campaign_name
       FROM vouchers v
       LEFT JOIN campaigns c ON c.id = v.campaign_id
       WHERE v.user_id = $1
       ORDER BY v.issued_at DESC`,
      [req.user.id]
    );
    res.json({ vouchers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
