# Voyago Smart Parking - QR Gate Access System

A complete IoT-based smart parking solution with QR code verification for automated gate access.

## 🏗️ System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Node.js API   │────▶│   MySQL DB      │
│   (Website)     │     │   (Express)     │     │                 │
└─────────────────┘     └───────┬─────────┘     └─────────────────┘
                                │
                                │ HTTP GET /api/smart-parking/verify/:qr_token
                                │
                        ┌───────▼─────────┐
                        │ Python Scanner  │
                        │ (OpenCV+pyzbar) │
                        └───────┬─────────┘
                                │
                                │ Serial (USB)
                                │
                        ┌───────▼─────────┐
                        │     ESP32       │
                        │  Gate Controller│
                        └───────┬─────────┘
                                │
                        ┌───────▼─────────┐
                        │ Servo + Buzzer  │
                        │   (Gate/Boom)   │
                        └─────────────────┘
```

## 📁 Project Structure

```
travel/
├── backend/
│   ├── controllers/
│   │   └── smartParkingController.js  # QR verification logic
│   ├── routes/
│   │   └── smartParkingRoutes.js      # API routes
│   ├── database/
│   │   ├── smart_parking_schema.sql   # Main parking tables
│   │   └── qr_verification_schema.sql # QR token tables
│   ├── config/
│   │   └── db.js                      # Database connection
│   └── server.js                      # Express server
│
├── iot/
│   ├── qr_scanner.py                  # Python QR scanner
│   ├── esp32_gate_controller/
│   │   └── esp32_gate_controller.ino  # Arduino code for ESP32
│   └── requirements.txt               # Python dependencies
│
└── frontend/
    └── (existing HTML/CSS/JS files)
```

## 🔧 Setup Instructions

### 1. Database Setup

Run the SQL schema to create required tables:

```sql
-- Run in MySQL
SOURCE backend/database/smart_parking_schema.sql;
SOURCE backend/database/qr_verification_schema.sql;
```

Or manually add the qr_token column:

```sql
ALTER TABLE parking_bookings 
ADD COLUMN qr_token VARCHAR(36) UNIQUE,
ADD COLUMN qr_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN qr_verified_at DATETIME NULL,
ADD COLUMN entry_time DATETIME NULL,
ADD COLUMN exit_time DATETIME NULL,
ADD INDEX idx_qr_token (qr_token);

CREATE TABLE IF NOT EXISTS parking_access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    qr_token VARCHAR(36) NOT NULL,
    action ENUM('entry', 'exit') NOT NULL,
    gate_id VARCHAR(50) DEFAULT 'GATE-01',
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES parking_bookings(id)
);
```

### 2. Node.js Backend Setup

```bash
cd travel/backend

# Install dependencies (if not already installed)
npm install express cors mysql2 qrcode uuid

# Start server
node server.js
```

**Required npm packages:**
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `mysql2` - MySQL driver
- `qrcode` - QR code generation
- `uuid` - UUID generation

### 3. Python Scanner Setup

```bash
cd travel/iot

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install opencv-python pyzbar requests pyserial

# Run scanner
python qr_scanner.py
```

**Required pip packages:**
- `opencv-python` - Camera access and image processing
- `pyzbar` - QR code decoding
- `requests` - HTTP API calls
- `pyserial` - Serial communication with ESP32

**Note for Windows:** You may need to install Visual C++ Redistributable for pyzbar to work.

### 4. ESP32 Setup

1. **Install Arduino IDE** (if not installed)
   - Download from: https://www.arduino.cc/en/software

2. **Add ESP32 Board Support**
   - Go to File → Preferences
   - Add to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools → Board → Board Manager
   - Search "ESP32" and install "esp32 by Espressif Systems"

3. **Install ESP32Servo Library**
   - Go to Sketch → Include Library → Manage Libraries
   - Search "ESP32Servo" and install

4. **Upload Code**
   - Open `travel/iot/esp32_gate_controller/esp32_gate_controller.ino`
   - Select board: Tools → Board → ESP32 Dev Module
   - Select correct COM port
   - Click Upload

### 5. Hardware Wiring

```
ESP32 Pin Connections:
┌─────────────┬─────────────────────┐
│ ESP32 Pin   │ Component           │
├─────────────┼─────────────────────┤
│ GPIO 13     │ Servo Signal (Orange)│
│ GPIO 12     │ Buzzer (+)          │
│ GND         │ Servo GND (Brown)   │
│ GND         │ Buzzer (-)          │
│ 5V/VIN      │ Servo VCC (Red)     │
│ USB         │ Computer (Serial)   │
└─────────────┴─────────────────────┘
```

**Note:** For larger servo motors, use external 5V power supply.

## 🔌 API Endpoints

### QR Verification (for Python scanner)

```http
GET /api/verify/:qr_token
```

**Response (Success):**
```json
{
    "success": true,
    "action": "OPEN",
    "gate_action": "entry",
    "message": "Welcome! Gate opening...",
    "data": {
        "booking_id": "VPK-A1B2C3D4",
        "slot_number": "A-15",
        "location": "Chennai Central Parking",
        "valid_until": "2/22/2026, 6:00:00 PM"
    }
}
```

**Response (Denied):**
```json
{
    "success": false,
    "action": "DENY",
    "message": "Booking has expired"
}
```

### Get Booking by QR Token

```http
GET /api/smart-parking/booking-by-qr/:qr_token
```

## 🔄 Complete Flow

1. **User books parking slot on website**
   - Frontend calls `POST /api/smart-parking/bookings`
   - Backend generates UUID `qr_token`
   - QR code image returned to user

2. **User arrives at parking gate**
   - Shows QR code to camera
   - Python scanner reads QR code

3. **QR verification**
   - Python extracts `qr_token` from QR data
   - Calls `GET /api/verify/:qr_token`

4. **API validates booking**
   - Checks if token exists
   - Checks if booking is active
   - Checks if within valid time window

5. **Gate control**
   - If valid: Python sends "OPEN" via serial
   - If invalid: Python sends "DENY" via serial

6. **ESP32 action**
   - "OPEN": Buzzer beep → Servo opens → Wait 3s → Auto-close
   - "DENY": Error buzzer pattern → Gate stays closed

## 📝 QR Code Data Structure

```json
{
    "booking_id": "VPK-A1B2C3D4",
    "qr_token": "550e8400-e29b-41d4-a716-446655440000",
    "location_name": "Chennai Central Parking",
    "slot_number": "A-15",
    "start_time": "2026-02-22T14:00:00.000Z",
    "end_time": "2026-02-22T18:00:00.000Z",
    "amount": 80,
   "verify_url": "http://localhost:3000/api/verify/550e8400-..."
}
```

## 🐛 Troubleshooting

### Camera not detected
```bash
# Try different camera index
CAMERA_INDEX = 1  # in qr_scanner.py
```

### ESP32 not detected
```bash
# Check COM port
# Windows: Device Manager → Ports (COM & LPT)
# Linux: ls /dev/ttyUSB*

# Manually set port in qr_scanner.py
ESP32_PORT = "COM3"  # Windows
ESP32_PORT = "/dev/ttyUSB0"  # Linux
```

### pyzbar import error (Windows)
```bash
# Install Visual C++ Redistributable 2015-2022
# Download from Microsoft website
```

### Serial permission denied (Linux)
```bash
sudo usermod -a -G dialout $USER
# Logout and login again
```

## 🧪 Testing

### Test API manually
```bash
# Using curl
curl http://localhost:3000/api/smart-parking/verify/your-qr-token-here

# Using PowerShell
Invoke-RestMethod "http://localhost:3000/api/smart-parking/verify/your-qr-token-here"
```

### Test ESP32 commands
Open Serial Monitor (115200 baud) and type:
- `TEST` - Test all hardware
- `OPEN` - Open gate
- `CLOSE` - Close gate
- `STATUS` - Get current status

## 📦 Dependencies Summary

### Node.js (package.json)
```json
{
    "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "mysql2": "^3.6.0",
        "qrcode": "^1.5.3",
        "uuid": "^9.0.0"
    }
}
```

### Python (requirements.txt)
```
opencv-python>=4.8.0
pyzbar>=0.1.9
requests>=2.31.0
pyserial>=3.5
```

### Arduino Libraries
- ESP32Servo (from Library Manager)

## 📄 License

Part of Voyago Tourism Project
