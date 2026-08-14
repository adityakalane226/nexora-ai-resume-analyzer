const { errorResponse } = require('../utils/response');

/**
 * basic authentication verification middleware
 * ensures user context is present on protected routes.
 */
const authorizeUser = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, 'User identity not established', 'UNAUTHORIZED');
  }
  next();
};

module.exports = authorizeUser;
