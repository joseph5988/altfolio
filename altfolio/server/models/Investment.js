const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  assetName: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
    maxlength: [100, 'Asset name cannot be more than 100 characters']
  },
  assetType: {
    type: String,
    required: [true, 'Asset type is required'],
    enum: ['Startup', 'Crypto Fund', 'Farmland', 'Collectible', 'Other'],
    default: 'Other'
  },
  investedAmount: {
    type: Number,
    required: [true, 'Invested amount is required'],
    min: [0, 'Invested amount cannot be negative'],
    max: [1000000000, 'Invested amount cannot exceed 1 billion']
  },
  currentValue: {
    type: Number,
    required: [true, 'Current value is required'],
    min: [0, 'Current value cannot be negative'],
    max: [1000000000, 'Current value cannot exceed 1 billion']
  },
  investmentDate: {
    type: Date,
    required: [true, 'Investment date is required'],
    default: Date.now
  },
  owners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

investmentSchema.index({ assetType: 1 });
investmentSchema.index({ investmentDate: -1 });
investmentSchema.index({ owners: 1 });
investmentSchema.index({ isActive: 1 });

investmentSchema.virtual('roi').get(function() {
  if (this.investedAmount === 0) return 0;
  return ((this.currentValue - this.investedAmount) / this.investedAmount) * 100;
});

investmentSchema.virtual('absoluteGain').get(function() {
  return this.currentValue - this.investedAmount;
});

investmentSchema.set('toJSON', { virtuals: true });
investmentSchema.set('toObject', { virtuals: true });

investmentSchema.statics.getPortfolioTotals = async function(userId = null) {
  const matchStage = { isActive: true };
  if (userId) {
    matchStage.owners = userId;
  }

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalInvested: { $sum: '$investedAmount' },
        totalCurrentValue: { $sum: '$currentValue' },
        totalGain: { $sum: { $subtract: ['$currentValue', '$investedAmount'] } },
        investmentCount: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      totalInvested: 0,
      totalCurrentValue: 0,
      totalGain: 0,
      totalRoi: 0,
      investmentCount: 0
    };
  }

  const totals = result[0];
  totals.totalRoi = totals.totalInvested > 0 
    ? (totals.totalGain / totals.totalInvested) * 100 
    : 0;

  return totals;
};

investmentSchema.statics.getAllocationByType = async function(userId = null) {
  const matchStage = { isActive: true };
  if (userId) {
    matchStage.owners = userId;
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$assetType',
        totalInvested: { $sum: '$investedAmount' },
        totalCurrentValue: { $sum: '$currentValue' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalCurrentValue: -1 } }
  ]);
};

investmentSchema.methods.canUserModify = function(userId, userRole) {
  if (userRole === 'admin') return true;
  return this.owners.includes(userId);
};

module.exports = mongoose.model('Investment', investmentSchema); 