const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');
const UserModel = require('../models/user.model');

/**
 * authentication middleware: verifies bearer jwt token in authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // extract token from "bearer <token>"

    if (!token) {
      return errorResponse(res, 401, 'Authentication token required', 'UNAUTHORIZED');
    }

    const secret = process.env.JWT_SECRET || 'nexora_jwt_secret_key_change_me';
    
    jwt.verify(token, secret, async (err, decodedPayload) => {
      if (err) {
        return errorResponse(res, 403, 'Invalid or expired authentication token', 'FORBIDDEN');
      }

      // fetch active user profile from database or payload
      const user = await UserModel.findById(decodedPayload.id);
      if (!user) {
        return errorResponse(res, 401, 'User account associated with token no longer exists', 'UNAUTHORIZED');
      }

      // attach user context to express request object
      req.user = user;
      next();
    });
  } catch (error) {
    next(error);
  }
};

module.exports = authenticateToken;
