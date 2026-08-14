/**
 * utility helper for standard api responses across express controllers
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const errorResponse = (res, statusCode = 500, message = 'An error occurred', errorCode = 'SERVER_ERROR', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse
};
