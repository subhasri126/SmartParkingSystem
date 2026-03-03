// =====================================================
// AUTHENTICATION ROUTES
// Define all authentication endpoints
// =====================================================

const express = require('express');
const router = express.Router();
const {
    register,
    verifyOTP,
    login,
    resendOTP,
    getMe
} = require('../controllers/authController');
const { simpleLogin } = require('../controllers/simpleAuthController');

const { protect } = require('../middleware/authMiddleware');
const {
    registerValidation,
    loginValidation,
    otpValidation,
    resendOTPValidation,
    validate
} = require('../middleware/validation');

// Public Routes
router.post('/register', registerValidation, validate, register);
router.post('/verify-otp', otpValidation, validate, verifyOTP);
// Full secure login route with JWT and Bcrypt validation
router.post('/login', loginValidation, validate, login);
router.post('/resend-otp', resendOTPValidation, validate, resendOTP);
// Simple login route for plain text password (for dev/testing)
router.post('/simple-login', simpleLogin);

// Protected Routes (require authentication)
router.get('/me', protect, getMe);

module.exports = router;
