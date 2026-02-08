/*
 * ESP32 + Neo-6M GPS Module - Geo-fencing System
 * 
 * This code reads GPS coordinates from Neo-6M module and sends them
 * to the Node.js backend server for geo-fence detection.
 * 
 * Hardware Connections:
 * - Neo-6M GPS TX -> ESP32 GPIO16 (RX2)
 * - Neo-6M GPS RX -> ESP32 GPIO17 (TX2)
 * - Buzzer -> GPIO 23
 * - LED -> GPIO 22
 * 
 * Required Libraries:
 * - TinyGPS++ (Install from Arduino Library Manager)
 * - WiFi (Built-in)
 * - HTTPClient (Built-in)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server URL
const char* serverUrl = "http://YOUR_SERVER_IP:5000/api/tracking/update";

// Device ID (Must match the deviceID in database)
const char* deviceID = "ESP32_001";

// GPS Serial
HardwareSerial gpsSerial(2); // Use UART2
TinyGPSPlus gps;

// Pins
const int buzzerPin = 23;
const int ledPin = 22;

// Update interval (milliseconds)
const unsigned long updateInterval = 5000; // 5 seconds
unsigned long lastUpdate = 0;

// Speed variables
float currentSpeed = 0;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17); // RX=16, TX=17
  
  // Initialize pins
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);
  digitalWrite(ledPin, LOW);
  
  // Connect to WiFi
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Blink LED to indicate ready
  blinkLED(3);
}

void loop() {
  // Read GPS data
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      displayGPSInfo();
    }
  }
  
  // Check if it's time to send update
  if (millis() - lastUpdate >= updateInterval) {
    if (gps.location.isValid() && WiFi.status() == WL_CONNECTED) {
      sendLocationUpdate();
      lastUpdate = millis();
    } else {
      Serial.println("Waiting for valid GPS signal...");
    }
  }
  
  // Check for GPS timeout
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println("No GPS detected. Check wiring!");
    delay(1000);
  }
}

void displayGPSInfo() {
  if (gps.location.isValid()) {
    Serial.print("Latitude: ");
    Serial.println(gps.location.lat(), 6);
    Serial.print("Longitude: ");
    Serial.println(gps.location.lng(), 6);
    
    if (gps.speed.isValid()) {
      currentSpeed = gps.speed.kmph();
      Serial.print("Speed: ");
      Serial.print(currentSpeed);
      Serial.println(" km/h");
    }
    
    Serial.print("Satellites: ");
    Serial.println(gps.satellites.value());
    Serial.println("-------------------");
  }
}

void sendLocationUpdate() {
  HTTPClient http;
  
  // Prepare JSON data
  String jsonData = "{";
  jsonData += "\"deviceID\":\"" + String(deviceID) + "\",";
  jsonData += "\"latitude\":" + String(gps.location.lat(), 6) + ",";
  jsonData += "\"longitude\":" + String(gps.location.lng(), 6) + ",";
  jsonData += "\"speed\":" + String(currentSpeed, 2);
  jsonData += "}";
  
  Serial.println("Sending data to server...");
  Serial.println(jsonData);
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    // Parse response and trigger alerts
    processServerResponse(response);
    
    // Blink LED to indicate successful transmission
    blinkLED(1);
  } else {
    Serial.print("Error on sending POST: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

void processServerResponse(String response) {
  // Check if response contains alerts
  if (response.indexOf("\"type\":\"toll\"") > 0) {
    Serial.println("TOLL ZONE DETECTED!");
    triggerTollAlert();
  }
  
  if (response.indexOf("\"type\":\"danger\"") > 0) {
    Serial.println("DANGER ZONE DETECTED!");
    triggerDangerAlert();
  }
}

void triggerTollAlert() {
  // Short beep for toll
  digitalWrite(ledPin, HIGH);
  tone(buzzerPin, 1000, 200);
  delay(200);
  digitalWrite(ledPin, LOW);
}

void triggerDangerAlert() {
  // Multiple beeps for danger
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPin, HIGH);
    tone(buzzerPin, 2000, 200);
    delay(200);
    digitalWrite(ledPin, LOW);
    delay(100);
  }
}

void blinkLED(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);
    delay(100);
  }
}
