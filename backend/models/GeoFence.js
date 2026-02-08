const mongoose = require('mongoose');

const geoFenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['toll', 'danger']
  },
  description: {
    type: String,
    trim: true
  },
  coordinates: {
    type: [[Number]], // Array of [longitude, latitude] pairs
    required: true,
    validate: {
      validator: function(coords) {
        return coords.length >= 3; // Minimum 3 points for a polygon
      },
      message: 'A geo-fence must have at least 3 coordinate points'
    }
  },
  tollAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  alertMessage: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  speedLimit: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GeoFence', geoFenceSchema);
