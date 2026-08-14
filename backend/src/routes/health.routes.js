const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/response');
const db = require('../config/db');

/**
 * get /api/health
 * public health check endpoint inspecting express app & postgresql connection pool.
 */
router.get('/health', async (req, res, next) => {
  try {
    let dbStatus = 'disconnected';
    try {
      await db.query('SELECT 1');
      dbStatus = 'connected';
    } catch (dbErr) {
      dbStatus = `offline (${dbErr.message})`;
    }

    return successResponse(res, 200, 'System Health Check OK', {
      service: 'Node.js + Express REST API Backend',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      uptime: `${Math.floor(process.uptime())}s`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
