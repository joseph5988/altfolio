const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated. Please contact administrator.' });
      }
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }
      user.lastLogin = new Date();
      await user.save();
      const token = generateToken(user._id);
      res.json({ message: 'Login successful', token, user: user.toPublicJSON() });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user.toPublicJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.json({ message: 'Token refreshed successfully', token, user: req.user.toPublicJSON() });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/init', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'This endpoint is not available in production.' });
    }
    await User.createDefaultUsers();
    res.json({
      message: 'Default users created successfully',
      users: [
        { email: 'admin@altfolio.com', password: 'admin123', role: 'admin' },
        { email: 'viewer@altfolio.com', password: 'viewer123', role: 'viewer' }
      ]
    });
  } catch (error) {
    console.error('Init users error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router; 