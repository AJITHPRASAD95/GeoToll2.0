/*
 * Sample Data Initialization Script
 * Run this script to populate the database with sample data for testing
 * 
 * Usage: node initSampleData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const GeoFence = require('./models/GeoFence');
const Transaction = require('./models/Transaction');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/geofencing';

// Sample data
const sampleUsers = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    mobile: '+919876543210',
    walletBalance: 1000
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    mobile: '+919876543211',
    walletBalance: 1500
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    mobile: '+919876543212',
    walletBalance: 2000
  }
];

const sampleGeoFences = [
  {
    name: 'NH-66 Toll Plaza - Kochi',
    type: 'toll',
    description: 'Main toll plaza on National Highway 66',
    coordinates: [
      [76.2673, 9.9312],
      [76.2678, 9.9318],
      [76.2665, 9.9325],
      [76.2660, 9.9319]
    ],
    tollAmount: 75,
    speedLimit: 80,
    isActive: true
  },
  {
    name: 'Edappally Flyover Toll',
    type: 'toll',
    description: 'Toll collection point at Edappally flyover',
    coordinates: [
      [76.3012, 10.0145],
      [76.3018, 10.0151],
      [76.3008, 10.0158],
      [76.3002, 10.0152]
    ],
    tollAmount: 50,
    speedLimit: 60,
    isActive: true
  },
  {
    name: 'Sharp Curve - Munnar Road',
    type: 'danger',
    description: 'Dangerous sharp curve on Munnar hill road',
    coordinates: [
      [77.0612, 10.0912],
      [77.0618, 10.0918],
      [77.0608, 10.0925],
      [77.0602, 10.0919]
    ],
    alertMessage: 'WARNING: Sharp curve ahead! Reduce speed.',
    severity: 'high',
    speedLimit: 30,
    isActive: true
  },
  {
    name: 'School Zone - St. Mary\'s School',
    type: 'danger',
    description: 'School zone with children crossing',
    coordinates: [
      [76.2712, 9.9412],
      [76.2718, 9.9418],
      [76.2708, 9.9425],
      [76.2702, 9.9419]
    ],
    alertMessage: 'CAUTION: School zone. Children crossing.',
    severity: 'critical',
    speedLimit: 20,
    isActive: true
  },
  {
    name: 'Accident-Prone Zone - Wayanad Ghat',
    type: 'danger',
    description: 'Accident-prone area with poor visibility',
    coordinates: [
      [76.0912, 11.6012],
      [76.0918, 11.6018],
      [76.0908, 11.6025],
      [76.0902, 11.6019]
    ],
    alertMessage: 'DANGER: Accident-prone zone. Drive carefully.',
    severity: 'critical',
    speedLimit: 40,
    isActive: true
  }
];

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully!');

    // Clear existing data
    console.log('\nClearing existing data...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await GeoFence.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Existing data cleared!');

    // Create users
    console.log('\nCreating sample users...');
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`Created ${createdUsers.length} users`);

    // Create vehicles for users
    console.log('\nCreating sample vehicles...');
    const sampleVehicles = [
      {
        userID: createdUsers[0]._id,
        deviceID: 'ESP32_001',
        registrationNo: 'KL-01-AB-1234',
        vehicleType: 'car',
        manufacturer: 'Toyota',
        model: 'Fortuner',
        color: 'White',
        currentLocation: {
          type: 'Point',
          coordinates: [76.2670, 9.9315]
        }
      },
      {
        userID: createdUsers[1]._id,
        deviceID: 'ESP32_002',
        registrationNo: 'KL-07-CD-5678',
        vehicleType: 'suv',
        manufacturer: 'Mahindra',
        model: 'Scorpio',
        color: 'Black',
        currentLocation: {
          type: 'Point',
          coordinates: [76.3015, 10.0148]
        }
      },
      {
        userID: createdUsers[2]._id,
        deviceID: 'ESP32_003',
        registrationNo: 'KL-14-EF-9012',
        vehicleType: 'car',
        manufacturer: 'Honda',
        model: 'City',
        color: 'Silver',
        currentLocation: {
          type: 'Point',
          coordinates: [77.0615, 10.0915]
        }
      }
    ];

    const createdVehicles = await Vehicle.insertMany(sampleVehicles);
    console.log(`Created ${createdVehicles.length} vehicles`);

    // Update users with vehicle IDs
    for (let i = 0; i < createdUsers.length; i++) {
      createdUsers[i].vehicles.push(createdVehicles[i]._id);
      await createdUsers[i].save();
    }
    console.log('Updated users with vehicle references');

    // Create geo-fences
    console.log('\nCreating sample geo-fences...');
    const createdGeoFences = await GeoFence.insertMany(sampleGeoFences);
    console.log(`Created ${createdGeoFences.length} geo-fences`);

    // Create some sample transactions
    console.log('\nCreating sample transactions...');
    const sampleTransactions = [
      {
        vehicleID: createdVehicles[0]._id,
        userID: createdUsers[0]._id,
        zoneID: createdGeoFences[0]._id,
        amount: 75,
        status: 'success',
        location: {
          type: 'Point',
          coordinates: [76.2670, 9.9315]
        },
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        remarks: 'Toll paid successfully'
      },
      {
        vehicleID: createdVehicles[1]._id,
        userID: createdUsers[1]._id,
        zoneID: createdGeoFences[1]._id,
        amount: 50,
        status: 'success',
        location: {
          type: 'Point',
          coordinates: [76.3015, 10.0148]
        },
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        remarks: 'Toll paid successfully'
      },
      {
        vehicleID: createdVehicles[0]._id,
        userID: createdUsers[0]._id,
        zoneID: createdGeoFences[1]._id,
        amount: 50,
        status: 'success',
        location: {
          type: 'Point',
          coordinates: [76.3010, 10.0150]
        },
        timestamp: new Date(Date.now() - 10800000), // 3 hours ago
        remarks: 'Toll paid successfully'
      }
    ];

    const createdTransactions = await Transaction.insertMany(sampleTransactions);
    console.log(`Created ${createdTransactions.length} sample transactions`);

    // Update wallet balances based on transactions
    for (const transaction of createdTransactions) {
      if (transaction.status === 'success') {
        const user = await User.findById(transaction.userID);
        user.walletBalance -= transaction.amount;
        await user.save();
      }
    }
    console.log('Updated wallet balances');

    // Display summary
    console.log('\n========================================');
    console.log('DATABASE INITIALIZATION COMPLETE!');
    console.log('========================================');
    console.log('\nSummary:');
    console.log(`✓ Users: ${createdUsers.length}`);
    console.log(`✓ Vehicles: ${createdVehicles.length}`);
    console.log(`✓ Geo-fences: ${createdGeoFences.length}`);
    console.log(`✓ Transactions: ${createdTransactions.length}`);
    
    console.log('\nSample Login Credentials:');
    createdUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Mobile: ${user.mobile}`);
      console.log(`  Wallet: ₹${user.walletBalance.toFixed(2)}`);
      console.log(`  Vehicle: ${sampleVehicles[index].registrationNo} (${sampleVehicles[index].deviceID})`);
    });

    console.log('\nGeo-fences Created:');
    createdGeoFences.forEach((gf, index) => {
      console.log(`\n${index + 1}. ${gf.name} (${gf.type})`);
      if (gf.type === 'toll') {
        console.log(`   Toll Amount: ₹${gf.tollAmount}`);
      } else {
        console.log(`   Severity: ${gf.severity}`);
        console.log(`   Alert: ${gf.alertMessage}`);
      }
    });

    console.log('\n========================================');
    console.log('You can now start the server and access the dashboard!');
    console.log('========================================\n');

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run initialization
initializeDatabase();
