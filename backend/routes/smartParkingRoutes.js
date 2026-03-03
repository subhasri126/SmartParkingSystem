// =====================================================
// SMART PARKING ROUTES (Enhanced)
// Location-based parking with booking system
// =====================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getAllParkingLocations,
    searchParkingLocations,
    getParkingLocationById,
    getLocationSlots,
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    completeBooking,
    getParkingStats,
    getParkingCities,
    simulateSlotChanges,
    verifyQRToken,
    getBookingByQRToken
} = require('../controllers/smartParkingController');

// =====================================================
// PUBLIC ROUTES (No authentication required)
// =====================================================

// @route   GET /api/smart-parking/verify/:qr_token
// @desc    Verify QR token for gate access (called by Python/ESP32 scanner)
router.get('/verify/:qr_token', verifyQRToken);

// @route   GET /api/smart-parking/booking-by-qr/:qr_token
// @desc    Get booking details by QR token
router.get('/booking-by-qr/:qr_token', getBookingByQRToken);

// @route   GET /api/smart-parking/cities
// @desc    Get all cities with parking locations
router.get('/cities', getParkingCities);

// @route   GET /api/smart-parking/locations
// @desc    Get all parking locations (with optional city/state filter)
router.get('/locations', getAllParkingLocations);

// @route   GET /api/smart-parking/locations/search
// @desc    Search parking locations by coordinates (Haversine) or city name
router.get('/locations/search', searchParkingLocations);

// @route   GET /api/smart-parking/locations/:id
// @desc    Get parking location by ID with all slots
router.get('/locations/:id', getParkingLocationById);

// @route   GET /api/smart-parking/locations/:id/slots
// @desc    Get all slots for a location (with optional status filter)
router.get('/locations/:id/slots', getLocationSlots);

// @route   POST /api/smart-parking/locations/:id/simulate
// @desc    Simulate real-time slot changes (for demo)
router.post('/locations/:id/simulate', simulateSlotChanges);

// =====================================================
// PROTECTED ROUTES (Authentication required)
// =====================================================

// @route   GET /api/smart-parking/stats
// @desc    Get user's parking statistics
router.get('/stats', protect, getParkingStats);

// @route   GET /api/smart-parking/bookings
// @desc    Get user's parking bookings
router.get('/bookings', protect, getUserBookings);

// @route   POST /api/smart-parking/bookings
// @desc    Create a new parking booking
router.post('/bookings', protect, createBooking);

// @route   GET /api/smart-parking/bookings/:id
// @desc    Get specific booking by ID
router.get('/bookings/:id', protect, getBookingById);

// @route   POST /api/smart-parking/bookings/:id/cancel
// @desc    Cancel a booking
router.post('/bookings/:id/cancel', protect, cancelBooking);

// @route   POST /api/smart-parking/bookings/:id/complete
// @desc    Mark booking as completed
router.post('/bookings/:id/complete', protect, completeBooking);

module.exports = router;
