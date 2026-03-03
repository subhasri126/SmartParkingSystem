// =====================================================
// PARKING STATUS ROUTES
// API route for dashboard parking status
// =====================================================

const express = require('express');
const router = express.Router();
const { getParkingStatus } = require('../controllers/parkingStatusController');

// @route   GET /api/parking/status
// @desc    Get parking slot statistics for dashboard
router.get('/status', getParkingStatus);

module.exports = router;
