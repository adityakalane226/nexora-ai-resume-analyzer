const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * controller handling user registration, login, and profile fetching
 */
class AuthController {
  /**
   * register a new user
   */
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // 1. check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return errorResponse(res, 400, 'An account with this email address already exists.', 'EMAIL_EXISTS');
      }

      // 2. hash password securely using bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 3. insert user into postgresql
      const user = await UserModel.createUser({
        name,
        email,
        passwordHash
      });

      // 4. generate jwt token
      const secret = process.env.JWT_SECRET || 'nexora_jwt_secret_key_change_me';
      const token = jwt.sign(
        { id: user.id, email: user.email },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return successResponse(res, 201, 'User registered successfully', {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at
        },
        token
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * login user
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1. find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return errorResponse(res, 401, 'Invalid email address or password.', 'INVALID_CREDENTIALS');
      }

      // 2. compare password hash
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return errorResponse(res, 401, 'Invalid email address or password.', 'INVALID_CREDENTIALS');
      }

      // 3. generate jwt token
      const secret = process.env.JWT_SECRET || 'nexora_jwt_secret_key_change_me';
      const token = jwt.sign(
        { id: user.id, email: user.email },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return successResponse(res, 200, 'Login successful', {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at
        },
        token
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * get current authenticated user profile
   */
  static async getMe(req, res, next) {
    try {
      return successResponse(res, 200, 'User profile fetched successfully', {
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
