# Voyago Smart Travel + IoT Parking System

## Project Upgrade Summary

This document summarizes the integration of the Smart Parking system into the Voyago travel website.

---

## 🗄️ Database Structure

### Table: `parking_slots`
| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| slot_number | INT (UNIQUE, NOT NULL) | Parking slot number |
| status | ENUM('available', 'occupied', 'reserved') | Current status |
| last_updated | TIMESTAMP | Auto-updated on changes |

### Table: `parking_logs`
| Column | Type | Description |
|--------|------|-------------|
| log_id | INT (PK, AUTO_INCREMENT) | Primary key |
| slot_id | INT (FK) | Reference to parking_slots |
| status | ENUM('available', 'occupied', 'reserved') | Status at time of change |
| changed_at | TIMESTAMP | When the change occurred |

---

## 🔌 API Endpoints

### Parking Summary
```
GET /api/parking/summary
```
Returns: Total slots, available, occupied, reserved counts, and last updated time.

### Get All Slots
```
GET /api/parking
```
Returns: Array of all parking slots with their current status.

### Get Slot by ID
```
GET /api/parking/:id
```
Returns: Single parking slot details.

### Reserve a Slot
```
POST /api/parking/reserve/:id
```
- Changes slot status to 'reserved'
- Automatically releases after 10 minutes
- Logs the change to parking_logs

### Update Slot Status (IoT)
```
POST /api/parking/update/:id
Body: { "status": "available" | "occupied" | "reserved" }
```
- For IoT sensor integration
- Updates slot status and logs the change

### Parking Analytics
```
GET /api/parking/analytics
```
Returns:
- Peak hours (occupancy by hour)
- Daily occupancy trends
- Most used slots
- Total usage statistics

### Available Count
```
GET /api/parking/available-count
```
Returns: Count of currently available slots.

---

## 📄 New Pages

### 1. Smart Parking Page (`smart-parking.html`)
- Real-time slot grid display
- Color-coded status (Green: Available, Red: Occupied, Yellow: Reserved)
- Click-to-reserve functionality
- 10-minute reservation countdown
- Auto-refresh every 5 seconds

### 2. Analytics Page (`analytics.html`)
- Peak Hours Bar Chart (Chart.js)
- Daily Occupancy Line Chart
- Most Used Slots Horizontal Bar
- Status Distribution Doughnut Chart
- Key insights section

---

## 🏠 Homepage Updates

### New Headline
```
"Plan Your Trip with Real-Time Smart Parking"
```

### Smart Parking Summary Section
- Total Slots count
- Available count
- Occupied count  
- Reserved count
- Last updated timestamp
- Link to Smart Parking page

---

## 🔍 Explore Page Updates

Each destination card now includes:
- Parking availability badge
- Number of available slots
- Direct link to Smart Parking page

---

## 🔧 Setup Instructions

### 1. Initialize Database Tables
```bash
cd backend
node init-parking-tables.js
```

### 2. Start the Server
```bash
npm start
```

### 3. Access the Application
- Homepage: `http://localhost:3000`
- Smart Parking: `http://localhost:3000/smart-parking.html`
- Analytics: `http://localhost:3000/analytics.html`

---

## 🌐 IoT Integration

### Sensor → Server Communication

When hardware sensor detects:
- **Car Present**: Send POST to `/api/parking/update/:id` with `{"status": "occupied"}`
- **Car Leaves**: Send POST to `/api/parking/update/:id` with `{"status": "available"}`

### Example IoT Request (using curl)
```bash
# Mark slot 1 as occupied
curl -X POST http://localhost:3000/api/parking/update/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "occupied"}'

# Mark slot 1 as available
curl -X POST http://localhost:3000/api/parking/update/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "available"}'
```

---

## 📁 File Structure

```
travel/
├── index.html                    # Updated homepage
├── smart-parking.html            # NEW - Parking slot management
├── smart-parking-styles.css      # NEW - Parking page styles
├── smart-parking-script.js       # NEW - Parking page logic
├── analytics.html                # NEW - Analytics dashboard
├── analytics-styles.css          # NEW - Analytics styles
├── analytics-script.js           # NEW - Chart.js integration
├── explore.html                  # Updated with parking info
├── explore-script.js             # Updated with parking availability
├── explore-styles.css            # Updated with parking badge styles
├── script.js                     # Updated with parking summary fetch
├── styles.css                    # Updated with parking summary styles
├── backend/
│   ├── server.js                 # Updated with parking routes
│   ├── controllers/
│   │   └── parkingController.js  # NEW - Parking logic
│   ├── routes/
│   │   └── parkingRoutes.js      # NEW - Parking API routes
│   ├── database/
│   │   └── parking_schema.sql    # NEW - Database schema
│   └── init-parking-tables.js    # NEW - DB initialization script
```

---

## ✅ Features Checklist

- [x] Database tables (parking_slots, parking_logs)
- [x] REST API endpoints for parking operations
- [x] Homepage headline update
- [x] Homepage parking summary section
- [x] Smart Parking page with slot grid
- [x] Slot reservation with 10-minute auto-release
- [x] Real-time refresh (5-second polling)
- [x] Explore page parking availability
- [x] Analytics dashboard with Chart.js
- [x] Peak hours analysis
- [x] Daily occupancy trends
- [x] IoT integration endpoints
- [x] Mobile responsive design
- [x] Error handling
- [x] Proper REST API structure

---

## 🎯 Production Considerations

1. **Security**: Add authentication to IoT update endpoints
2. **Rate Limiting**: Adjust for IoT sensor frequency
3. **WebSockets**: Consider replacing polling with WebSockets for true real-time
4. **Database Indexing**: Indexes are added for performance
5. **Logging**: All status changes are logged for audit trails
