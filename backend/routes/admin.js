const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { generateSignedPayload } = require('../cryptoHelper');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

// ── GET /api/admin/users
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, nric, phone, address, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/admin/merchants
router.get('/merchants', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, business_name, uen, address, bank_account, is_approved, created_at FROM merchants ORDER BY created_at DESC'
    );
    res.json({ merchants: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PATCH /api/admin/merchants/:id/approve — Approve or suspend a merchant
router.patch('/merchants/:id/approve', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  try {
    await pool.query('UPDATE merchants SET is_approved = $1 WHERE id = $2', [approved, id]);
    res.json({ message: `Merchant ${approved ? 'approved' : 'suspended'}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/admin/issue-voucher — Issue a single voucher to a user
router.post('/issue-voucher', authenticateToken, requireRole('admin'), async (req, res) => {
  const { user_id, amount, campaign_id, is_physical } = req.body;
  if (!user_id || !amount || !campaign_id) {
    return res.status(400).json({ error: 'user_id, amount, and campaign_id are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert the voucher first to get an ID
    const vResult = await client.query(
      'INSERT INTO vouchers (campaign_id, user_id, amount, signed_payload, is_physical) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [campaign_id, user_id, amount, 'TEMP', is_physical || false]
    );
    const voucherId = vResult.rows[0].id;

    // Generate the signed payload now that we have the ID
    const signedPayload = generateSignedPayload(voucherId, user_id, amount);

    // Update the voucher with the real payload
    await client.query('UPDATE vouchers SET signed_payload = $1 WHERE id = $2', [signedPayload, voucherId]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Voucher issued successfully.',
      voucher_id: voucherId,
      signed_payload: signedPayload
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to issue voucher.' });
  } finally {
    client.release();
  }
});

// ── POST /api/admin/issue-bulk — Issue vouchers to multiple users at once
router.post('/issue-bulk', authenticateToken, requireRole('admin'), async (req, res) => {
  const { user_ids, amount, campaign_id } = req.body;
  if (!user_ids || !Array.isArray(user_ids) || !amount || !campaign_id) {
    return res.status(400).json({ error: 'user_ids (array), amount, campaign_id required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const issued = [];

    for (const user_id of user_ids) {
      const vResult = await client.query(
        'INSERT INTO vouchers (campaign_id, user_id, amount, signed_payload) VALUES ($1,$2,$3,$4) RETURNING id',
        [campaign_id, user_id, amount, 'TEMP']
      );
      const voucherId = vResult.rows[0].id;
      const signedPayload = generateSignedPayload(voucherId, user_id, amount);
      await client.query('UPDATE vouchers SET signed_payload = $1 WHERE id = $2', [signedPayload, voucherId]);
      issued.push({ user_id, voucher_id: voucherId });
    }

    await client.query('COMMIT');
    res.status(201).json({ message: `${issued.length} vouchers issued.`, issued });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Bulk issue failed.' });
  } finally {
    client.release();
  }
});

// ── PATCH /api/admin/vouchers/:id/void — Void a lost/stolen voucher
router.patch('/vouchers/:id/void', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE vouchers SET is_voided = TRUE WHERE id = $1', [id]);
    res.json({ message: `Voucher #${id} has been voided.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/admin/ledger — Full ledger for all merchants
router.get('/ledger', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id AS merchant_id, m.business_name, m.bank_account,
              COUNT(l.id) AS redemptions,
              SUM(CASE WHEN NOT l.is_paid_out THEN l.amount ELSE 0 END) AS amount_owed,
              SUM(l.amount) AS total_redeemed
       FROM merchants m
       LEFT JOIN ledger l ON l.merchant_id = m.id
       GROUP BY m.id, m.business_name, m.bank_account
       ORDER BY amount_owed DESC`
    );
    res.json({ ledger: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PATCH /api/admin/ledger/merchant/:id/payout — Mark merchant as paid out
router.patch('/ledger/merchant/:id/payout', authenticateToken, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE ledger SET is_paid_out = TRUE, paid_out_at = NOW() WHERE merchant_id = $1 AND is_paid_out = FALSE',
      [id]
    );
    res.json({ message: `All pending payouts for merchant #${id} marked as paid.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/admin/generate-pdf/:campaign_id — Generate PDF of physical vouchers
router.get('/generate-pdf/:campaign_id', authenticateToken, requireRole('admin'), async (req, res) => {
  const { campaign_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT v.id, v.signed_payload, v.amount, u.name AS user_name
       FROM vouchers v
       JOIN users u ON u.id = v.user_id
       WHERE v.campaign_id = $1 AND v.is_physical = TRUE AND v.is_voided = FALSE`,
      [campaign_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No physical vouchers found for this campaign.' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fidyah-vouchers-campaign-${campaign_id}.pdf`);
    doc.pipe(res);

    const vouchersPerRow = 2;
    const cardWidth = 240;
    const cardHeight = 180;
    const marginX = 40;
    const marginY = 40;

    for (let i = 0; i < result.rows.length; i++) {
      const voucher = result.rows[i];
      const col = i % vouchersPerRow;
      const row = Math.floor(i / vouchersPerRow);

      if (i > 0 && col === 0 && row % 4 === 0) doc.addPage();

      const x = marginX + col * (cardWidth + 20);
      const y = marginY + (row % 4) * (cardHeight + 20);

      doc.rect(x, y, cardWidth, cardHeight).stroke();
      doc.fontSize(10).text('MUIS Fidyah Voucher', x + 10, y + 10, { width: cardWidth - 20, align: 'center' });
      doc.fontSize(16).text(`$${voucher.amount}`, x + 10, y + 28, { width: cardWidth - 20, align: 'center' });
      doc.fontSize(9).text(voucher.user_name, x + 10, y + 50, { width: cardWidth - 20, align: 'center' });

      const qrDataUrl = await QRCode.toDataURL(voucher.signed_payload, { width: 100 });
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrBuffer, x + (cardWidth / 2) - 50, y + 65, { width: 100 });

      doc.fontSize(7).text(`Voucher #${voucher.id}`, x + 10, y + 165, { width: cardWidth - 20, align: 'center' });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed.' });
  }
});

// ── GET /api/admin/stats — Dashboard summary stats
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [users, merchants, vouchers, ledger] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM merchants WHERE is_approved = TRUE'),
      pool.query('SELECT COUNT(*) FILTER (WHERE is_redeemed) AS redeemed, COUNT(*) AS total FROM vouchers'),
      pool.query('SELECT SUM(amount) FILTER (WHERE NOT is_paid_out) AS pending_payout FROM ledger')
    ]);
    res.json({
      total_users: parseInt(users.rows[0].count),
      approved_merchants: parseInt(merchants.rows[0].count),
      total_vouchers: parseInt(vouchers.rows[0].total),
      redeemed_vouchers: parseInt(vouchers.rows[0].redeemed),
      pending_payout: parseFloat(ledger.rows[0].pending_payout || 0).toFixed(2)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
