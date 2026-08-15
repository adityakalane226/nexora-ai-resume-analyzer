const { Pool } = require('pg');
require('dotenv').config();

// check if connecting to a cloud database (neon, supabase, render, etc.)
const isRemoteDb = Boolean(
  process.env.DATABASE_URL ||
  process.env.DB_SSL === 'true' ||
  process.env.NODE_ENV === 'production' ||
  (process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST))
);

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'nexora_resume_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: isRemoteDb ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err.message);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query
};
