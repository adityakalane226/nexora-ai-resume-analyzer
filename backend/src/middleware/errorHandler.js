const { errorResponse } = require('../utils/response');

/**
 * centralized error handling middleware for express application
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] Path: ${req.path} | Error:`, err.message || err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  return errorResponse(res, statusCode, message, errorCode, err.errors || null);
};

module.exports = errorHandler;
