require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/database');

const app = express();

/* ======================
   Middleware
====================== */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* ======================
   Database
====================== */
connectDB();

/* ======================
   Serve Frontend
====================== */
app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   API Routes
====================== */
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/geofences', require('./routes/geofences'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/transactions', require('./routes/transactions'));

/* ======================
   Health Check
====================== */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GeoToll API is running',
    timestamp: new Date().toISOString()
  });
});

/* ======================
   Frontend Entry
====================== */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ======================
   404 Handler
====================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/* ======================
   Error Handler
====================== */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

/* ======================
   Start Server
====================== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
