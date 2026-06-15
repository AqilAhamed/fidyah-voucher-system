const { Pool } = require('pg');
require('dotenv').config();

// Use the Supabase Connection String (Transaction Pooler Mode port 6543 or Session Port 5432)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for secure cloud hosting providers like Supabase
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client instance', err);
});

module.exports = pool;