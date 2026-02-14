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
router.post('/login', loginValidation, validate, login);
router.post('/resend-otp', resendOTPValidation, validate, resendOTP);

// Protected Routes (require authentication)
router.get('/me', protect, getMe);

module.exports = router;
