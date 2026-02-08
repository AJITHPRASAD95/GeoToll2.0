const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  vehicleID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  zoneID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeoFence',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  transactionType: {
    type: String,
    enum: ['toll_payment', 'wallet_recharge'],
    default: 'toll_payment'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    trim: true
  }
});

transactionSchema.index({ timestamp: -1 });
transactionSchema.index({ vehicleID: 1, timestamp: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
