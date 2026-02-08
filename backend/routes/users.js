const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Transaction = require('../models/Transaction');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().populate('vehicles').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('vehicles');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { name, mobile, email, walletBalance } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email or mobile already exists' 
      });
    }

    const user = new User({
      name,
      mobile,
      email,
      walletBalance: walletBalance || 0
    });

    await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Recharge wallet
router.post('/:id/recharge', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid recharge amount' 
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.walletBalance += parseFloat(amount);
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userID: user._id,
      vehicleID: user.vehicles[0] || null,
      zoneID: null,
      amount: parseFloat(amount),
      status: 'success',
      transactionType: 'wallet_recharge',
      location: { type: 'Point', coordinates: [0, 0] },
      remarks: 'Wallet recharge'
    });
    await transaction.save();

    res.json({ 
      success: true, 
      data: user,
      message: `Wallet recharged successfully. New balance: ₹${user.walletBalance}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete associated vehicles
    await Vehicle.deleteMany({ userID: req.params.id });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
