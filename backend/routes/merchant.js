const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { verifyPayload } = require('../cryptoHelper');

// ── POST /api/merchant/redeem — Core redemption with pessimistic lock
router.post('/redeem', authenticateToken, requireRole('merchant'), async (req, res) => {
  const { qr_payload } = req.body;
  const merchantId = req.user.id;

  if (!qr_payload) return res.status(400).json({ error: 'qr_payload is required.' });

  // ── Step 1: Cryptographic verification
  const voucherData = verifyPayload(qr_payload);
  if (!voucherData) {
    return res.status(400).json({ error: 'Invalid or forged QR Code. Redemption denied.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Step 2: Pessimistic lock (FOR UPDATE) — prevents double-spending
    // Any duplicate simultaneous request will queue here until this transaction completes
    const voucherResult = await client.query(
      'SELECT * FROM vouchers WHERE id = $1 FOR UPDATE',
      [voucherData.v_id]
    );

    if (voucherResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Voucher not found in database.' });
    }

    const voucher = voucherResult.rows[0];

    // ── Step 3: Business logic validation
    if (voucher.is_voided) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This voucher has been voided by MUIS.' });
    }

    if (voucher.is_redeemed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Voucher has already been redeemed!' });
    }

    // Ensure voucher belongs to the correct user
    if (voucher.user_id !== voucherData.u_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Voucher user mismatch. Invalid QR Code.' });
    }

    // ── Step 4: Mark voucher as redeemed
    await client.query(
      'UPDATE vouchers SET is_redeemed = TRUE, merchant_id = $1, redeemed_at = NOW() WHERE id = $2',
      [merchantId, voucher.id]
    );

    // ── Step 5: Record in ledger for payout tracking
    await client.query(
      'INSERT INTO ledger (voucher_id, merchant_id, amount) VALUES ($1, $2, $3)',
      [voucher.id, merchantId, voucher.amount]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Voucher redeemed! $${voucher.amount} will be credited to your account.`,
      amount: voucher.amount,
      redeemed_at: new Date().toISOString()
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Transaction failed. Please try again.' });
  } finally {
    client.release();
  }
});

// ── GET /api/merchant/ledger — Merchant's own payout summary
router.get('/ledger', authenticateToken, requireRole('merchant'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.amount, l.is_paid_out, l.paid_out_at, l.transaction_at,
              v.id AS voucher_id
       FROM ledger l
       JOIN vouchers v ON v.id = l.voucher_id
       WHERE l.merchant_id = $1
       ORDER BY l.transaction_at DESC`,
      [req.user.id]
    );
    const totalOwed = result.rows
      .filter(r => !r.is_paid_out)
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    res.json({ ledger: result.rows, total_owed: totalOwed.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
