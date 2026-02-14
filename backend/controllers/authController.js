// =====================================================
// AUTHENTICATION CONTROLLER
// Handle all authentication logic
// =====================================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { full_name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        
        if (existingUser) {
            // If user exists but not verified, allow resending OTP
            if (!existingUser.is_verified) {
                // Generate new OTP
                const otpCode = generateOTP();
                const otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 5) * 60000);

                // Update OTP in database
                await User.updateOTP(email, otpCode, otpExpiry);

                // Send OTP email
                await sendOTPEmail(email, otpCode, existingUser.full_name);

                return res.status(200).json({
                    success: true,
                    message: 'User already exists but not verified. New OTP sent to your email.',
                    email: email
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Email already registered and verified. Please login.'
            });
        }

        // Create new user
        const userId = await User.create({ full_name, email, password });

        // Generate OTP
        const otpCode = generateOTP();
        const otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 5) * 60000);

        // Save OTP to database
        await User.updateOTP(email, otpCode, otpExpiry);

        // Send OTP email
        await sendOTPEmail(email, otpCode, full_name);

        res.status(201).json({
            success: true,
            message: 'Registration successful! OTP sent to your email.',
            email: email,
            userId: userId
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        // Find user and verify OTP
        const user = await User.verifyOTP(email, otp);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please try again.'
            });
        }

        // Mark user as verified
        await User.markAsVerified(email);

        // Send welcome email
        await sendWelcomeEmail(email, user.full_name);

        // Generate JWT token
        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! Welcome to Voyago.',
            token: token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                is_verified: true
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Verify password
        const isPasswordValid = await User.comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Check if user is verified
        if (!user.is_verified) {
            // Generate new OTP
            const otpCode = generateOTP();
            const otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 5) * 60000);

            // Update OTP
            await User.updateOTP(email, otpCode, otpExpiry);

            // Send OTP email
            await sendOTPEmail(email, otpCode, user.full_name);

            return res.status(403).json({
                success: false,
                message: 'Email not verified. A new OTP has been sent to your email.',
                requires_verification: true,
                email: email
            });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token: token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                is_verified: user.is_verified
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        if (user.is_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified. Please login.'
            });
        }

        // Check cooldown
        const canResend = await User.canResendOTP(email);

        if (!canResend) {
            const remainingTime = await User.getResendCooldownRemaining(email);
            return res.status(429).json({
                success: false,
                message: `Please wait ${remainingTime} seconds before requesting a new OTP.`,
                remaining_seconds: remainingTime
            });
        }

        // Generate new OTP
        const otpCode = generateOTP();
        const otpExpiry = new Date(Date.now() + (process.env.OTP_EXPIRY_MINUTES || 5) * 60000);

        // Update OTP
        await User.updateOTP(email, otpCode, otpExpiry);

        // Send OTP email
        await sendOTPEmail(email, otpCode, user.full_name);

        res.status(200).json({
            success: true,
            message: 'New OTP sent to your email.',
            email: email
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile (Protected Route)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.status(200).json({
            success: true,
            user: user
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    verifyOTP,
    login,
    resendOTP,
    getMe
};
