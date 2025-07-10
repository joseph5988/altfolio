const express = require('express');
const { body, validationResult } = require('express-validator');
const Investment = require('../models/Investment');
const User = require('../models/User');
const { authenticateToken, canAccessInvestment, validateInvestmentAmount } = require('../middleware/auth');

const router = express.Router();

// Validation rules for investment creation/update
const investmentValidation = [
  body('assetName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Asset name is required and must be between 1-100 characters'),
  body('assetType')
    .isIn(['Startup', 'Crypto Fund', 'Farmland', 'Collectible', 'Other'])
    .withMessage('Asset type must be one of: Startup, Crypto Fund, Farmland, Collectible, Other'),
  body('investedAmount')
    .isFloat({ min: 0, max: 1000000000 })
    .withMessage('Invested amount must be a positive number and cannot exceed 1 billion'),
  body('currentValue')
    .isFloat({ min: 0, max: 1000000000 })
    .withMessage('Current value must be a positive number and cannot exceed 1 billion'),
  body('investmentDate')
    .optional()
    .isISO8601()
    .withMessage('Investment date must be a valid date'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('owners')
    .isArray({ min: 1 })
    .withMessage('At least one owner is required'),
  body('owners.*')
    .isMongoId()
    .withMessage('Each owner must be a valid user ID')
];

// @route   GET /api/investments
// @desc    Get all investments (filtered by user role)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Non-admin users can only see their own investments
    if (req.user.role !== 'admin') {
      query.owners = req.user._id;
    }

    const investments = await Investment.find(query)
      .populate('owners', 'name email')
      .sort({ investmentDate: -1 });

    res.json({
      success: true,
      count: investments.length,
      data: investments
    });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

// @route   GET /api/investments/:id
// @desc    Get specific investment by ID
// @access  Private
router.get('/:id', authenticateToken, canAccessInvestment, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id)
      .populate('owners', 'name email');

    if (!investment) {
      return res.status(404).json({
        error: 'Investment not found.'
      });
    }

    res.json({
      success: true,
      data: investment
    });
  } catch (error) {
    console.error('Get investment error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

// @route   POST /api/investments
// @desc    Create new investment
// @access  Private
router.post('/', 
  authenticateToken,
  validateInvestmentAmount,
  investmentValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { assetName, assetType, investedAmount, currentValue, investmentDate, description, notes, owners } = req.body;

      // Verify all owners exist and are active
      const ownerUsers = await User.find({ 
        _id: { $in: owners }, 
        isActive: true 
      });

      if (ownerUsers.length !== owners.length) {
        return res.status(400).json({
          error: 'One or more specified owners do not exist or are inactive.'
        });
      }

      // Check if non-admin user is trying to add someone else as owner
      if (req.user.role !== 'admin' && !owners.includes(req.user._id.toString())) {
        return res.status(403).json({
          error: 'You can only create investments where you are an owner.'
        });
      }

      const investment = new Investment({
        assetName,
        assetType,
        investedAmount,
        currentValue,
        investmentDate: investmentDate || new Date(),
        description,
        notes,
        owners
      });

      await investment.save();

      const populatedInvestment = await Investment.findById(investment._id)
        .populate('owners', 'name email');

      res.status(201).json({
        success: true,
        message: 'Investment created successfully',
        data: populatedInvestment
      });
    } catch (error) {
      console.error('Create investment error:', error);
      res.status(500).json({
        error: 'Internal server error.'
      });
    }
  }
);

// @route   PUT /api/investments/:id
// @desc    Update investment
// @access  Private
router.put('/:id',
  authenticateToken,
  canAccessInvestment,
  validateInvestmentAmount,
  investmentValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { assetName, assetType, investedAmount, currentValue, investmentDate, description, notes, owners } = req.body;

      // Verify all owners exist and are active
      const ownerUsers = await User.find({ 
        _id: { $in: owners }, 
        isActive: true 
      });

      if (ownerUsers.length !== owners.length) {
        return res.status(400).json({
          error: 'One or more specified owners do not exist or are inactive.'
        });
      }

      // Check if non-admin user is trying to remove themselves as owner
      if (req.user.role !== 'admin' && !owners.includes(req.user._id.toString())) {
        return res.status(403).json({
          error: 'You cannot remove yourself as an owner of this investment.'
        });
      }

      const updatedInvestment = await Investment.findByIdAndUpdate(
        req.params.id,
        {
          assetName,
          assetType,
          investedAmount,
          currentValue,
          investmentDate: investmentDate || new Date(),
          description,
          notes,
          owners
        },
        { new: true, runValidators: true }
      ).populate('owners', 'name email');

      res.json({
        success: true,
        message: 'Investment updated successfully',
        data: updatedInvestment
      });
    } catch (error) {
      console.error('Update investment error:', error);
      res.status(500).json({
        error: 'Internal server error.'
      });
    }
  }
);

// @route   DELETE /api/investments/:id
// @desc    Delete investment (soft delete)
// @access  Private
router.delete('/:id', authenticateToken, canAccessInvestment, async (req, res) => {
  try {
    const investment = await Investment.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Investment deleted successfully'
    });
  } catch (error) {
    console.error('Delete investment error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

// @route   GET /api/investments/portfolio/summary
// @desc    Get portfolio summary with totals and analytics
// @access  Private
router.get('/portfolio/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user._id;
    
    const portfolioTotals = await Investment.getPortfolioTotals(userId);
    const allocationByType = await Investment.getAllocationByType(userId);

    res.json({
      success: true,
      data: {
        summary: portfolioTotals,
        allocation: allocationByType
      }
    });
  } catch (error) {
    console.error('Portfolio summary error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

module.exports = router; 