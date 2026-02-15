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
const destinationRoutes = require('./routes/destinationRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const touristSpotsRoutes = require('./routes/touristSpotsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize Express app
const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// Security headers
app.use(helmet());

// CORS configuration - Allow frontend origin and local file previews
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5500"
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Not allowed by CORS"));
    },
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

// Test endpoint for frontend connectivity
app.get('/api/test', (req, res) => {
    res.json({ message: "Backend working" });
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
            getProfile: 'GET /api/auth/me (Protected)',
            destinations: 'GET /api/destinations',
            featuredDestinations: 'GET /api/destinations/featured',
            searchDestinations: 'GET /api/destinations/search'
        }
    });
});

// Request logging for debugging
app.use('/api/destinations', (req, res, next) => {
    console.log(`📍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Destination routes
app.use('/api/destinations', destinationRoutes);

// Hotel routes
app.use('/api/hotels', hotelRoutes);

// Tourist spots routes
app.use('/api/spots', touristSpotsRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// =====================================================
// SERVER INITIALIZATION
// =====================================================

const PORT = 5000;

const startServer = async () => {
    try {
        console.log('\n🔧 Initializing Voyago Backend Server...');
        console.log('━'.repeat(60));

        // Test database connection
        console.log('📊 Testing database connection...');
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database.');
            console.error('⚠️  Please check your MySQL credentials in .env file');
            console.error('⚠️  Attempting to start server anyway...');
            // Don't exit - allow server to start even if DB fails
        }

        // Verify email service (non-blocking - warn if fails)
        try {
            await verifyEmailService();
        } catch (emailError) {
            console.warn('⚠️  Email service not configured - authentication emails will fail');
            console.warn('   Set EMAIL_USER and EMAIL_PASSWORD in .env to enable email');
        }

        // Start server
        const server = app.listen(PORT, () => {
            console.log('\n' + '═'.repeat(60));
            console.log('✈️  VOYAGO BACKEND SERVER - RUNNING');
            console.log('═'.repeat(60));
            console.log(`🚀 Server Mode: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Server URL: http://localhost:${PORT}`);
            console.log(`📡 API Endpoint: http://localhost:${PORT}/api`);
            console.log(`💾 Database: ${process.env.DB_NAME}`);
            console.log(`🔓 CORS Enabled: http://localhost:5173`);
            console.log('═'.repeat(60));
            console.log('\n📋 Available Endpoints:');
            console.log('   GET  /api/test               - Test connectivity');
            console.log('   GET  /health                 - Health check');
            console.log('   GET  /api/destinations       - Get all destinations');
            console.log('   GET  /api/destinations/:id   - Get destination by ID');
            console.log('   POST /api/auth/register      - Register new user');
            console.log('   POST /api/auth/login         - Login user');
            console.log('═'.repeat(60));
            console.log('\n✅ Server is ready to accept connections!');
            console.log('   Frontend should connect to: http://localhost:' + PORT + '\n');
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
