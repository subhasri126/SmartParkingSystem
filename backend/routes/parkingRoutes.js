// =====================================================
// PARKING ROUTES
// RESTful API routes for Smart Parking System
// =====================================================

const express = require('express');
const router = express.Router();
const {
    getParkingSummary,
    getAllParkingSlots,
    getParkingSlotById,
    reserveParkingSlot,
    updateParkingSlot,
    getParkingAnalytics,
    getAvailableCount,
    getSlotsByLocation
} = require('../controllers/parkingController');

// @route   GET /api/parking/summary
// @desc    Get parking summary (total, available, occupied, reserved, last updated)
router.get('/summary', getParkingSummary);

// @route   GET /api/parking/analytics
// @desc    Get parking analytics (peak hours, daily occupancy, usage stats)
router.get('/analytics', getParkingAnalytics);

// @route   GET /api/parking/available-count
// @desc    Get count of available parking slots
router.get('/available-count', getAvailableCount);

// @route   GET /api/parking/slots/:locationId
// @desc    Get parking slots by location ID
router.get('/slots/:locationId', getSlotsByLocation);

// @route   GET /api/parking
// @desc    Get all parking slots
router.get('/', getAllParkingSlots);

// @route   GET /api/parking/:id
// @desc    Get parking slot by ID
router.get('/:id', getParkingSlotById);

// @route   POST /api/parking/reserve/:id
// @desc    Reserve a parking slot (auto-releases after 10 minutes)
router.post('/reserve/:id', reserveParkingSlot);

// @route   POST /api/parking/update/:id
// @desc    Update parking slot status (for IoT sensors)
router.post('/update/:id', updateParkingSlot);

module.exports = router;
