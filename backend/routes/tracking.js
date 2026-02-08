const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const GeoFence = require('../models/GeoFence');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { isPointInPolygon, isValidCoordinates } = require('../utils/geoUtils');

// Track vehicle location and check geo-fences
router.post('/update', async (req, res) => {
  try {
    const { deviceID, latitude, longitude, speed } = req.body;

    // Validate input
    if (!deviceID || !latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        message: 'Device ID, latitude, and longitude are required' 
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!isValidCoordinates(lon, lat)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid coordinates' 
      });
    }

    // Find vehicle by device ID
    const vehicle = await Vehicle.findOne({ deviceID }).populate('userID');
    if (!vehicle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vehicle not found' 
      });
    }

    // Update vehicle location
    vehicle.currentLocation = {
      type: 'Point',
      coordinates: [lon, lat]
    };
    vehicle.lastUpdated = new Date();
    await vehicle.save();

    // Check all active geo-fences
    const activeGeoFences = await GeoFence.find({ isActive: true });
    const triggeredZones = [];
    const alerts = [];

    for (const zone of activeGeoFences) {
      const isInside = isPointInPolygon([lon, lat], zone.coordinates);

      if (isInside) {
        triggeredZones.push({
          zoneID: zone._id,
          name: zone.name,
          type: zone.type
        });

        // Handle toll zone
        if (zone.type === 'toll') {
          const user = vehicle.userID;

          // Check if there's a recent transaction for this zone (within last 30 seconds)
          const recentTransaction = await Transaction.findOne({
            vehicleID: vehicle._id,
            zoneID: zone._id,
            timestamp: { $gte: new Date(Date.now() - 30000) }
          });

          if (!recentTransaction) {
            let status = 'success';
            let remarks = '';

            // Check wallet balance
            if (user.walletBalance >= zone.tollAmount) {
              user.walletBalance -= zone.tollAmount;
              await user.save();
              remarks = 'Toll paid successfully';
            } else {
              status = 'failed';
              remarks = 'Insufficient wallet balance';
            }

            // Create transaction
            const transaction = new Transaction({
              vehicleID: vehicle._id,
              userID: user._id,
              zoneID: zone._id,
              amount: zone.tollAmount,
              status: status,
              location: {
                type: 'Point',
                coordinates: [lon, lat]
              },
              remarks: remarks
            });

            await transaction.save();

            alerts.push({
              type: 'toll',
              zone: zone.name,
              amount: zone.tollAmount,
              status: status,
              message: remarks,
              balance: user.walletBalance
            });
          }
        }

        // Handle danger zone
        if (zone.type === 'danger') {
          alerts.push({
            type: 'danger',
            zone: zone.name,
            severity: zone.severity,
            message: zone.alertMessage || `Entering ${zone.name}`,
            speedLimit: zone.speedLimit
          });
        }
      }
    }

    res.json({ 
      success: true, 
      data: {
        vehicle: {
          id: vehicle._id,
          registrationNo: vehicle.registrationNo,
          location: {
            latitude: lat,
            longitude: lon
          }
        },
        triggeredZones: triggeredZones,
        alerts: alerts
      }
    });

  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get vehicle tracking history
router.get('/history/:vehicleId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      vehicleID: req.params.vehicleId 
    })
    .populate('zoneID')
    .sort({ timestamp: -1 })
    .limit(100);

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
