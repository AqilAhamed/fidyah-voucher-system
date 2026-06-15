const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes     = require('./routes/auth');
const voucherRoutes  = require('./routes/vouchers');
const merchantRoutes = require('./routes/merchant');
const adminRoutes    = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

// ── Routes
app.use('/api/auth',     authRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/admin',    adminRoutes);

// ── Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fidyah Voucher API is running.' });
});

// ── 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  Fidyah Voucher API running on http://localhost:${PORT}`);
  console.log(`📋  Health check: http://localhost:${PORT}/api/health\n`);
});
