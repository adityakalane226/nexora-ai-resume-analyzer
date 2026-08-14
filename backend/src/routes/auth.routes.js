const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../validators/auth.validator');
const authenticateToken = require('../middleware/auth.middleware');

/**
 * public authentication routes
 */
router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);

/**
 * protected authentication routes
 */
router.get('/me', authenticateToken, AuthController.getMe);

module.exports = router;
