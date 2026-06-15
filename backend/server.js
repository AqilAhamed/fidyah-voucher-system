const express = require('express');
const cors = require('cors');
require('dotenv').config();

const merchantRoutes = require('./routes/merchant');
const voucherRoutes = require('./routes/vouchers');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes (Notice auth route deletion — managed directly by Supabase on client)
app.use('/api/merchant', merchantRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal system fault occurred.' });
});

app.listen(PORT, () => {
  console.log(`🚀 MUIS Fidyah Supabase-Linked Core running on port ${PORT}`);
});