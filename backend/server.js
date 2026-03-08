// =====================================================
// VOYAGO AUTHENTICATION BACKEND SERVER
// Main entry point for the application
// =====================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { testConnection, closePool } = require('./config/database');
const { verifyEmailService } = require('./utils/emailService');
const authRoutes = require('./routes/authRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const touristSpotsRoutes = require('./routes/touristSpotsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const smartParkingRoutes = require('./routes/smartParkingRoutes');
const { verifyQRToken } = require('./controllers/smartParkingController');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const frontendRoot = path.join(__dirname, '../public');
const frontendIndex = path.join(frontendRoot, 'index.html');

// Initialize Express app
const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// Security headers
// Security headers with customized CSP
app.use(helmet({
    // Keep a CSP, but avoid directives that force HTTPS in local/LAN HTTP dev.
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: [
                "'self'",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001"
            ],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            objectSrc: ["'none'"],
            scriptSrcAttr: ["'none'"]
        }
    },
    // Disable these on HTTP IP access to prevent browser warnings/noise.
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
    hsts: false
}));

// CORS configuration - Allow frontend origin and local file previews
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5501",
    "http://127.0.0.1:5501"
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, file://)
        if (!origin) {
            callback(null, true);
            return;
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        // Allow localhost, loopback, and private-network origins regardless of port.
        try {
            const { hostname } = new URL(origin);
            const isPrivateIpv4 = /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(hostname);
            const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
            if (isLocalHost || isPrivateIpv4) {
                callback(null, true);
                return;
            }
        } catch (error) {
            // Ignore URL parse errors and fall through to block
        }

        // Log blocked origin for debugging
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory (Frontend)
app.use(express.static(path.join(__dirname, '../')));

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
        message: 'Voyago Smart Travel API',
        version: '2.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                verifyOTP: 'POST /api/auth/verify-otp',
                login: 'POST /api/auth/login',
                resendOTP: 'POST /api/auth/resend-otp',
                getProfile: 'GET /api/auth/me (Protected)'
            },
            destinations: {
                getAll: 'GET /api/destinations',
                featured: 'GET /api/destinations/featured',
                search: 'GET /api/destinations/search',
                getById: 'GET /api/destinations/:id'
            },
            parking: {
                summary: 'GET /api/parking/summary',
                getAll: 'GET /api/parking',
                getById: 'GET /api/parking/:id',
                reserve: 'POST /api/parking/reserve/:id',
                update: 'POST /api/parking/update/:id',
                analytics: 'GET /api/parking/analytics',
                availableCount: 'GET /api/parking/available-count'
            }
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
console.log('✅ Dashboard routes enabled at /api/dashboard');

// Parking routes (legacy)
app.use('/api/parking', parkingRoutes);
console.log('✅ Parking routes enabled at /api/parking');

// Smart Parking routes (enhanced with locations & bookings)
app.use('/api/smart-parking', smartParkingRoutes);
console.log('✅ Smart Parking routes enabled at /api/smart-parking');

// QR verification alias route for scanner integration
// Required flow endpoint: GET /api/verify/:qr_token
app.get('/api/verify/:qr_token', verifyQRToken);
console.log('✅ QR verification route enabled at /api/verify/:qr_token');

// SPA Catch-all Route: Serve index.html for any unknown route that is NOT an API route
app.get('*', (req, res, next) => {
    const extension = path.extname(req.path).toLowerCase();
    const staticAssetExtensions = new Set([
        '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
        '.webp', '.woff', '.woff2', '.ttf', '.eot', '.map', '.html'
    ]);
    const isStaticAssetRequest =
        req.path.startsWith('/stylesheets/') ||
        req.path.startsWith('/javascripts/') ||
        req.path.startsWith('/css/') ||
        req.path.startsWith('/js/') ||
        staticAssetExtensions.has(extension);

    if (req.url.startsWith('/api') || isStaticAssetRequest) {
        return next();
    }
    const indexPath = path.join(__dirname, '../frontend/index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            next(); // Fallback to 404 if index.html is missing
        }
    });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// =====================================================
// SERVER INITIALIZATION
// =====================================================

const PORT = process.env.PORT || 3000;

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

        // Start server with automatic port fallback if current port is busy
        const basePort = Number(PORT) || 3000;
        const maxPortAttempts = 10;

        const listenOnPort = (port, attemptsLeft) => new Promise((resolve, reject) => {
            const candidateServer = app.listen(port, () => {
                resolve({ server: candidateServer, activePort: port });
            });

            candidateServer.once('error', (error) => {
                if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
                    console.warn(`⚠️  Port ${port} is already in use. Trying port ${port + 1}...`);
                    return resolve(listenOnPort(port + 1, attemptsLeft - 1));
                }
                reject(error);
            });
        });

        const { server, activePort } = await listenOnPort(basePort, maxPortAttempts);

        console.log('\n' + '═'.repeat(60));
        console.log('✈️  VOYAGO BACKEND SERVER - RUNNING');
        console.log('═'.repeat(60));
        console.log(`🚀 Server Mode: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 Server URL: http://localhost:${activePort}`);
        console.log(`📡 API Endpoint: http://localhost:${activePort}/api`);
        console.log(`💾 Database: ${process.env.DB_NAME}`);
        console.log(`🔓 CORS Enabled: http://localhost:5173, http://localhost:3000`);
        console.log('═'.repeat(60));
        console.log('\n📋 Available Endpoints:');
        console.log('   GET  /api/test               - Test connectivity');
        console.log('   GET  /health                 - Health check');
        console.log('   GET  /api/destinations       - Get all destinations');
        console.log('   GET  /api/destinations/:id   - Get destination by ID');
        console.log('   POST /api/auth/register      - Register new user');
        console.log('   POST /api/auth/login         - Login user');
        console.log('   --- Smart Parking (IoT) ---');
        console.log('   GET  /api/parking/summary    - Parking summary');
        console.log('   GET  /api/parking            - Get all slots');
        console.log('   GET  /api/parking/:id        - Get slot by ID');
        console.log('   POST /api/parking/reserve/:id- Reserve a slot');
        console.log('   POST /api/parking/update/:id - Update slot (IoT)');
        console.log('   GET  /api/parking/analytics  - Parking analytics');
        console.log('═'.repeat(60));
        console.log('\n✅ Server is ready to accept connections!');
        console.log('   Frontend is served at: http://localhost:' + activePort + '\n');

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
