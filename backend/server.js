// =====================================================
// VOYAGO AUTHENTICATION BACKEND SERVER
// Main entry point for the application
// =====================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection, closePool } = require('./config/database');
const { verifyEmailService } = require('./utils/emailService');
const authRoutes = require('./routes/authRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    }
});

app.use('/api/auth', authLimiter);

// =====================================================
// ROUTES
// =====================================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Voyago Auth API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Voyago Authentication API',
        version: '1.0.0',
        endpoints: {
            register: 'POST /api/auth/register',
            verifyOTP: 'POST /api/auth/verify-otp',
            login: 'POST /api/auth/login',
            resendOTP: 'POST /api/auth/resend-otp',
            getProfile: 'GET /api/auth/me (Protected)'
        }
    });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// =====================================================
// SERVER INITIALIZATION
// =====================================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Verify email service
        await verifyEmailService();

        // Start server
        const server = app.listen(PORT, () => {
            console.log('');
            console.log('='.repeat(60));
            console.log('✈️  VOYAGO AUTHENTICATION SERVER');
            console.log('='.repeat(60));
            console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📡 API Endpoint: http://localhost:${PORT}/api`);
            console.log(`💾 Database: ${process.env.DB_NAME}`);
            console.log('='.repeat(60));
            console.log('');
            console.log('📋 Available Endpoints:');
            console.log('   POST /api/auth/register      - Register new user');
            console.log('   POST /api/auth/verify-otp    - Verify OTP code');
            console.log('   POST /api/auth/login         - Login user');
            console.log('   POST /api/auth/resend-otp    - Resend OTP');
            console.log('   GET  /api/auth/me            - Get user profile (Protected)');
            console.log('='.repeat(60));
            console.log('');
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('⚠️  SIGTERM received. Shutting down gracefully...');
            server.close(async () => {
                await closePool();
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
            server.close(async () => {
                await closePool();
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app;
