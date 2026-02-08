# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install MongoDB
Make sure MongoDB is installed and running on your system.

**Check if MongoDB is running:**
```bash
# Linux/Mac
sudo systemctl status mongodb

# Or check if it's listening on port 27017
netstat -an | grep 27017

# Windows
# Check Services for "MongoDB"
```

**Start MongoDB if not running:**
```bash
# Linux/Mac
sudo systemctl start mongodb

# Windows
# Start from Services or run mongod.exe
```

### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Initialize sample data (optional but recommended)
node initSampleData.js

# Start the server
npm start
```

You should see:
```
Server is running on port 5000
MongoDB Connected: localhost
```

### Step 3: Open Frontend

Simply open the `frontend/index.html` file in your web browser, or:

```bash
# Using Python (if installed)
cd frontend
python -m http.server 8080

# Then open http://localhost:8080 in browser
```

### Step 4: Explore the Dashboard

1. **Dashboard**: View statistics and recent transactions
2. **Users**: See sample users (Rajesh, Priya, Amit)
3. **Vehicles**: Check registered vehicles
4. **Geo-fences**: View toll and danger zones
5. **Transactions**: Monitor toll payments

## 🧪 Testing the System

### Test 1: Simulate Vehicle Tracking

Open a new terminal and run:

```bash
curl -X POST http://localhost:5000/api/tracking/update \
  -H "Content-Type: application/json" \
  -d '{
    "deviceID": "ESP32_001",
    "latitude": 9.9315,
    "longitude": 76.2670,
    "speed": 45
  }'
```

This simulates vehicle "KL-01-AB-1234" entering the Kochi toll plaza.

Expected response:
```json
{
  "success": true,
  "data": {
    "vehicle": {...},
    "triggeredZones": [{
      "zoneID": "...",
      "name": "NH-66 Toll Plaza - Kochi",
      "type": "toll"
    }],
    "alerts": [{
      "type": "toll",
      "zone": "NH-66 Toll Plaza - Kochi",
      "amount": 75,
      "status": "success",
      "message": "Toll paid successfully",
      "balance": 925
    }]
  }
}
```

### Test 2: Add a New Vehicle

1. Go to **Vehicles** page
2. Click **+ Add Vehicle**
3. Fill in details:
   - Owner: Select any user
   - Registration: KL-09-XY-9999
   - Device ID: ESP32_004
   - Type: Car
4. Click **Save**

### Test 3: Create a Custom Geo-fence

1. Go to **Geo-fences** page
2. Click **+ Add Geo-fence**
3. Fill in details:
   ```
   Name: Test Toll Plaza
   Type: Toll Zone
   Toll Amount: 100
   Coordinates:
   76.2700,9.9400
   76.2705,9.9405
   76.2695,9.9410
   76.2690,9.9405
   ```
4. Click **Save**

### Test 4: Recharge Wallet

1. Go to **Users** page
2. Click **Recharge** on any user
3. Enter amount (e.g., 500)
4. Click **Recharge**
5. Verify the balance updated

## 📍 Sample Test Coordinates

Use these coordinates to test different zones:

**Toll Plaza (Kochi):**
- Latitude: 9.9315
- Longitude: 76.2670

**Toll Plaza (Edappally):**
- Latitude: 10.0148
- Longitude: 76.3015

**Danger Zone (Munnar Road):**
- Latitude: 10.0915
- Longitude: 77.0615

**School Zone:**
- Latitude: 9.9415
- Longitude: 76.2715

## 🔍 API Testing with Postman

### Create User
```
POST http://localhost:5000/api/users
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "mobile": "+919999999999",
  "walletBalance": 2000
}
```

### Get All Vehicles
```
GET http://localhost:5000/api/vehicles
```

### Track Vehicle Location
```
POST http://localhost:5000/api/tracking/update
Content-Type: application/json

{
  "deviceID": "ESP32_001",
  "latitude": 9.9315,
  "longitude": 76.2670,
  "speed": 60
}
```

### Get Transaction Stats
```
GET http://localhost:5000/api/transactions/stats
```

## 🛠️ Troubleshooting

**Problem: Cannot connect to MongoDB**
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb
```

**Problem: Port 5000 already in use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process or change PORT in .env file
```

**Problem: Frontend can't connect to backend**
- Check `API_URL` in `frontend/script.js`
- Ensure backend is running on http://localhost:5000
- Check browser console for CORS errors

**Problem: Sample data not loading**
```bash
# Re-run the initialization script
cd backend
node initSampleData.js
```

## 🎯 Next Steps

1. **Hardware Integration**: Upload the ESP32 code to your device
2. **Customize Geo-fences**: Add your local toll plazas and danger zones
3. **Add Real Users**: Create actual user accounts
4. **Monitor Transactions**: Track real-time toll collections
5. **Generate Reports**: Use the API to create custom analytics

## 📚 Documentation

- Full API documentation: See README.md
- Database schema: See README.md
- ESP32 setup: See esp32_code/geofencing_esp32.ino

## 💡 Tips

- Keep the backend server running while using the frontend
- Use Chrome DevTools to monitor API requests
- Check backend console for detailed logs
- Sample data includes 3 users, 3 vehicles, and 5 geo-fences
- Wallet balances are automatically deducted when vehicles enter toll zones

## 🎉 You're All Set!

Your geo-fencing system is now ready to use. Start by exploring the dashboard and testing with the sample data provided.

Happy Geo-fencing! 🚗📍
