const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('vehicleID')
      .populate('userID')
      .populate('zoneID')
      .sort({ timestamp: -1 })
      .limit(500);

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transactions by user
router.get('/user/:userId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userID: req.params.userId })
      .populate('vehicleID')
      .populate('zoneID')
      .sort({ timestamp: -1 });

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transactions by vehicle
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ vehicleID: req.params.vehicleId })
      .populate('zoneID')
      .populate('userID')
      .sort({ timestamp: -1 });

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get transaction statistics
router.get('/stats', async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    const successfulTransactions = await Transaction.countDocuments({ status: 'success' });
    const failedTransactions = await Transaction.countDocuments({ status: 'failed' });

    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'success', transactionType: 'toll_payment' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const todayRevenue = await Transaction.aggregate([
      { 
        $match: { 
          status: 'success',
          transactionType: 'toll_payment',
          timestamp: { 
            $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
          } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({ 
      success: true, 
      data: {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        totalRevenue: totalRevenue[0]?.total || 0,
        todayRevenue: todayRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get revenue by date range
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {
      status: 'success',
      transactionType: 'toll_payment'
    };

    if (startDate || endDate) {
      matchQuery.timestamp = {};
      if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
      if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
    }

    const revenue = await Transaction.aggregate([
      { $match: matchQuery },
      { 
        $group: { 
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } 
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: revenue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
