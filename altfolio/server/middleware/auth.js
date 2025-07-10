const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid token or user inactive.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin role required.' 
    });
  }
  next();
};

// Middleware to check if user can access investment
const canAccessInvestment = async (req, res, next) => {
  try {
    const investmentId = req.params.id;
    const Investment = require('../models/Investment');
    
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found.' });
    }

    // Admin can access all investments
    if (req.user.role === 'admin') {
      req.investment = investment;
      return next();
    }

    // Check if user is an owner of the investment
    if (!investment.owners.includes(req.user._id)) {
      return res.status(403).json({ 
        error: 'Access denied. You do not own this investment.' 
      });
    }

    req.investment = investment;
    next();
  } catch (error) {
    console.error('Investment access check error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Middleware to validate investment amount for non-admin users
const validateInvestmentAmount = (req, res, next) => {
  const { investedAmount } = req.body;
  const userRole = req.user.role;

  if (userRole !== 'admin' && investedAmount > 1000000) {
    return res.status(400).json({
      error: 'Investment amount cannot exceed $1,000,000 for non-admin users.'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  canAccessInvestment,
  validateInvestmentAmount
}; 