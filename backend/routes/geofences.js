const express = require('express');
const router = express.Router();
const GeoFence = require('../models/GeoFence');

// Get all geo-fences
router.get('/', async (req, res) => {
  try {
    const geoFences = await GeoFence.find().sort({ createdAt: -1 });
    res.json({ success: true, data: geoFences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get active geo-fences
router.get('/active', async (req, res) => {
  try {
    const geoFences = await GeoFence.find({ isActive: true });
    res.json({ success: true, data: geoFences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get geo-fences by type
router.get('/type/:type', async (req, res) => {
  try {
    const geoFences = await GeoFence.find({ 
      type: req.params.type,
      isActive: true 
    });
    res.json({ success: true, data: geoFences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get geo-fence by ID
router.get('/:id', async (req, res) => {
  try {
    const geoFence = await GeoFence.findById(req.params.id);
    if (!geoFence) {
      return res.status(404).json({ success: false, message: 'Geo-fence not found' });
    }
    res.json({ success: true, data: geoFence });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new geo-fence
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      type, 
      description, 
      coordinates, 
      tollAmount, 
      alertMessage, 
      severity,
      speedLimit 
    } = req.body;

    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least 3 coordinate points are required for a geo-fence' 
      });
    }

    // Validate toll amount for toll zones
    if (type === 'toll' && (!tollAmount || tollAmount <= 0)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Toll amount is required for toll zones' 
      });
    }

    const geoFence = new GeoFence({
      name,
      type,
      description,
      coordinates,
      tollAmount: type === 'toll' ? tollAmount : 0,
      alertMessage,
      severity: severity || 'medium',
      speedLimit
    });

    await geoFence.save();
    res.status(201).json({ success: true, data: geoFence });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update geo-fence
router.put('/:id', async (req, res) => {
  try {
    const geoFence = await GeoFence.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!geoFence) {
      return res.status(404).json({ success: false, message: 'Geo-fence not found' });
    }

    res.json({ success: true, data: geoFence });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle geo-fence active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const geoFence = await GeoFence.findById(req.params.id);
    
    if (!geoFence) {
      return res.status(404).json({ success: false, message: 'Geo-fence not found' });
    }

    geoFence.isActive = !geoFence.isActive;
    geoFence.updatedAt = new Date();
    await geoFence.save();

    res.json({ 
      success: true, 
      data: geoFence,
      message: `Geo-fence ${geoFence.isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete geo-fence
router.delete('/:id', async (req, res) => {
  try {
    const geoFence = await GeoFence.findByIdAndDelete(req.params.id);
    
    if (!geoFence) {
      return res.status(404).json({ success: false, message: 'Geo-fence not found' });
    }

    res.json({ success: true, message: 'Geo-fence deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
