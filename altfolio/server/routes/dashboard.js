const express = require('express');
const Investment = require('../models/Investment');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user._id;
    
    // Get portfolio totals
    const portfolioTotals = await Investment.getPortfolioTotals(userId);
    
    // Get allocation by asset type
    const allocationByType = await Investment.getAllocationByType(userId);
    
    // Get recent investments (last 5)
    const recentInvestments = await Investment.find({ 
      isActive: true,
      ...(userId && { owners: userId })
    })
    .populate('owners', 'name email')
    .sort({ investmentDate: -1 })
    .limit(5);

    // Get top performing investments
    const topPerformers = await Investment.find({ 
      isActive: true,
      ...(userId && { owners: userId })
    })
    .populate('owners', 'name email')
    .sort({ roi: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        summary: portfolioTotals,
        allocation: allocationByType,
        recentInvestments,
        topPerformers
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

// @route   POST /api/dashboard/simulate
// @desc    Simulate value changes for investments
// @access  Private
router.post('/simulate', authenticateToken, async (req, res) => {
  try {
    const { investmentId, newValue, simulationType } = req.body;
    
    if (!investmentId || !newValue) {
      return res.status(400).json({
        error: 'Investment ID and new value are required.'
      });
    }

    // Find the investment and check access
    const investment = await Investment.findById(investmentId);
    if (!investment) {
      return res.status(404).json({
        error: 'Investment not found.'
      });
    }

    // Check if user can access this investment
    if (req.user.role !== 'admin' && !investment.owners.includes(req.user._id)) {
      return res.status(403).json({
        error: 'Access denied. You do not own this investment.'
      });
    }

    // Calculate simulation results
    const oldValue = investment.currentValue;
    const investedAmount = investment.investedAmount;
    const oldRoi = ((oldValue - investedAmount) / investedAmount) * 100;
    const newRoi = ((newValue - investedAmount) / investedAmount) * 100;
    const valueChange = newValue - oldValue;
    const roiChange = newRoi - oldRoi;

    const simulation = {
      investmentId,
      assetName: investment.assetName,
      oldValue,
      newValue,
      valueChange,
      oldRoi,
      newRoi,
      roiChange,
      simulationType: simulationType || 'manual',
      timestamp: new Date()
    };

    res.json({
      success: true,
      message: 'Simulation completed successfully',
      data: simulation
    });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

// @route   GET /api/dashboard/performance
// @desc    Get performance analytics
// @access  Private
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user._id;
    
    // Get all investments for performance analysis
    const investments = await Investment.find({ 
      isActive: true,
      ...(userId && { owners: userId })
    }).populate('owners', 'name email');

    // Calculate performance metrics
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
    const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalGain = totalCurrentValue - totalInvested;
    const overallRoi = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    // Count positive vs negative performers
    const positivePerformers = investments.filter(inv => inv.roi > 0).length;
    const negativePerformers = investments.filter(inv => inv.roi < 0).length;
    const neutralPerformers = investments.filter(inv => inv.roi === 0).length;

    // Get best and worst performers
    const bestPerformer = investments.length > 0 ? 
      investments.reduce((best, current) => current.roi > best.roi ? current : best) : null;
    const worstPerformer = investments.length > 0 ? 
      investments.reduce((worst, current) => current.roi < worst.roi ? current : worst) : null;

    res.json({
      success: true,
      data: {
        summary: {
          totalInvested,
          totalCurrentValue,
          totalGain,
          overallRoi,
          investmentCount: investments.length
        },
        performance: {
          positivePerformers,
          negativePerformers,
          neutralPerformers,
          bestPerformer,
          worstPerformer
        }
      }
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      error: 'Internal server error.'
    });
  }
});

module.exports = router; 