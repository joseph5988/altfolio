const express = require('express');
const router = express.Router();
const Investment = require('../models/Investment');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const investments = await Investment.find({ isActive: true }).populate('owners', 'name email');
    
    const summary = {
      totalInvested: 0,
      totalCurrentValue: 0,
      totalGain: 0,
      totalRoi: 0,
      investmentCount: investments.length
    };

    investments.forEach(investment => {
      summary.totalInvested += investment.investedAmount;
      summary.totalCurrentValue += investment.currentValue;
      summary.totalGain += investment.absoluteGain;
    });

    if (summary.totalInvested > 0) {
      summary.totalRoi = (summary.totalGain / summary.totalInvested) * 100;
    }

    const allocation = {};
    investments.forEach(investment => {
      if (!allocation[investment.assetType]) {
        allocation[investment.assetType] = {
          totalInvested: 0,
          totalCurrentValue: 0,
          count: 0
        };
      }
      allocation[investment.assetType].totalInvested += investment.investedAmount;
      allocation[investment.assetType].totalCurrentValue += investment.currentValue;
      allocation[investment.assetType].count += 1;
    });

    const allocationArray = Object.keys(allocation).map(type => ({
      _id: type,
      ...allocation[type]
    }));

    res.json({
      data: {
        summary,
        allocation: allocationArray,
        investments
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.post('/simulate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { investmentId, newValue, simulationType } = req.body;
    
    let investments;
    
    if (investmentId) {
      investments = await Investment.find({ _id: investmentId, isActive: true });
    } else {
      investments = await Investment.find({ isActive: true });
    }

    const simulationResults = [];
    
    for (const investment of investments) {
      let simulatedValue;
      
      if (newValue && investmentId === investment._id) {
        simulatedValue = newValue;
      } else {
        const changePercent = (Math.random() - 0.5) * 0.1;
        simulatedValue = investment.currentValue * (1 + changePercent);
      }

      const newRoi = ((simulatedValue - investment.investedAmount) / investment.investedAmount) * 100;
      const newGain = simulatedValue - investment.investedAmount;

      simulationResults.push({
        investmentId: investment._id,
        assetName: investment.assetName,
        originalValue: investment.currentValue,
        simulatedValue: Math.round(simulatedValue * 100) / 100,
        changePercent: ((simulatedValue - investment.currentValue) / investment.currentValue) * 100,
        newRoi: Math.round(newRoi * 100) / 100,
        newGain: Math.round(newGain * 100) / 100
      });
    }

    const totalOriginalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalSimulatedValue = simulationResults.reduce((sum, result) => sum + result.simulatedValue, 0);
    const portfolioChangePercent = ((totalSimulatedValue - totalOriginalValue) / totalOriginalValue) * 100;

    res.json({
      data: {
        simulationResults,
        portfolioImpact: {
          totalOriginalValue: Math.round(totalOriginalValue * 100) / 100,
          totalSimulatedValue: Math.round(totalSimulatedValue * 100) / 100,
          portfolioChangePercent: Math.round(portfolioChangePercent * 100) / 100
        },
        simulationType: simulationType || 'random'
      }
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ error: 'Failed to run simulation' });
  }
});

module.exports = router; 