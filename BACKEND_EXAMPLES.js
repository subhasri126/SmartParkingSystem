// ========================================
// VOYAGO AUTH - BACKEND IMPLEMENTATION EXAMPLES
// Choose your preferred backend framework
// ========================================

// ==========================================
// OPTION 1: Node.js / Express + MongoDB
// ==========================================

/**
 * Installation:
 * npm install express mongoose bcrypt jsonwebtoken nodemailer redis dotenv cors
 */

// ===== server.js =====
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const redis = require('redis');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Redis Client for OTP
const redisClient = redis.createClient();
redisClient.connect().catch(console.error);

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    rememberToken: String,
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date
});

const User = mongoose.model('User', userSchema);

// Email Configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ===== ROUTES =====

/**
 * POST /api/auth/register
 * Register a new user
 */
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user (unverified)
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            verified: false
        });

        await newUser.save();

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redisClient.setEx(`otp:${email}`, 300, otp); // 5 minutes

        // Send verification email
        await transporter.sendMail({
            to: email,
            subject: 'Voyago - Verify Your Email',
            html: `
                <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4A90E2;">Welcome to Voyago!</h2>
                    <p>Your verification code is:</p>
                    <h1 style="color: #4A90E2; letter-spacing: 5px; text-align: center;">${otp}</h1>
                    <p style="color: #666; margin-top: 20px;">
                        This code expires in 5 minutes. 
                        Do not share this code with anyone.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        Happy travels!<br>
                        The Voyago Team
                    </p>
                </div>
            `
        });

        res.json({
            success: true,
            message: 'Registration successful. Check your email for verification code.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and activate account
 */
app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Validate input
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP required' });
        }

        // Get stored OTP from Redis
        const storedOtp = await redisClient.get(`otp:${email}`);

        if (!storedOtp) {
            return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
        }

        if (storedOtp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }

        // Mark user as verified
        const user = await User.findOneAndUpdate(
            { email },
            { verified: true },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Delete OTP from Redis
        await redisClient.del(`otp:${email}`);

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Email verified successfully!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
});

/**
 * POST /api/auth/login
 * User login
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;

    try {
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'Email not registered' });
        }

        // Check if verified
        if (!user.verified) {
            // Generate new OTP for unverified user
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await redisClient.setEx(`otp:${email}`, 300, otp);

            // Send verification email
            await transporter.sendMail({
                to: email,
                subject: 'Voyago - Verify Your Email',
                html: `<p>Verification code: <strong>${otp}</strong></p>`
            });

            return res.status(401).json({
                success: false,
                needsVerification: true,
                message: 'Please verify your email first. Code sent to your inbox.'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set secure cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP code
 */
app.post('/api/auth/resend-otp', async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Email not found' });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redisClient.setEx(`otp:${email}`, 300, otp);

        // Send email
        await transporter.sendMail({
            to: email,
            subject: 'Voyago - New Verification Code',
            html: `<p>Your new verification code is: <strong>${otp}</strong></p>`
        });

        res.json({
            success: true,
            message: 'Verification code resent. Check your email.'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Failed to resend OTP. Please try again.' });
    }
});

/**
 * POST /api/auth/forgot-password
 * Send password reset link
 */
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists
            return res.json({ success: true, message: 'Check your email for reset link' });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store reset token in Redis
        await redisClient.setEx(`reset:${user._id}`, 3600, resetToken);

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            to: email,
            subject: 'Voyago - Reset Your Password',
            html: `
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link expires in 1 hour.</p>
            `
        });

        res.json({ success: true, message: 'Password reset link sent to your email' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Middleware for protected routes
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * GET /api/auth/profile
 * Get user profile (protected)
 */
app.get('/api/auth/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Voyago Auth Server running on port ${PORT}`);
});

// ==========================================
// ENVIRONMENT VARIABLES (.env file)
// ==========================================
/*
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/voyago
JWT_SECRET=your_super_secret_jwt_key_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
*/

// ==========================================
// OPTION 2: Python / Django + PostgreSQL
// ==========================================

/*
# Installation:
# pip install django djangorestframework django-cors-headers djangorestframework-simplejwt python-decouple redis

# settings.py
INSTALLED_APPS = [
    'rest_framework',
    'corsheaders',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    # ... other apps
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ... other middleware
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    verified = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)

# views.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
import redis
import random
import string

redis_client = redis.Redis(host='localhost', port=6379, db=0)

class RegisterView(APIView):
    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([name, email, password]):
            return Response({'error': 'All fields required'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return Response({'error': 'Password too short'}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            first_name=name,
            password=password,
            verified=False
        )

        # Generate OTP
        otp = ''.join(random.choices(string.digits, k=6))
        redis_client.setex(f'otp:{email}', 300, otp)

        # Send email (use Celery for async)
        send_verification_email.delay(email, otp)

        return Response({
            'success': True,
            'message': 'Registration successful. Check your email.'
        })

class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        stored_otp = redis_client.get(f'otp:{email}')
        if not stored_otp or stored_otp.decode() != otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.get(email=email)
        user.verified = True
        user.save()

        redis_client.delete(f'otp:{email}')

        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'token': str(refresh.access_token),
            'user': {
                'id': user.id,
                'name': user.first_name,
                'email': user.email
            }
        })
*/

// ==========================================
// OPTION 3: Firebase Backend
// ==========================================

/*
// firebase-auth.js
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();

// Custom claims for verified status
exports.registerUser = functions.https.onCall(async (data, context) => {
    try {
        const { email, password, name } = data;

        // Create user
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name
        });

        // Store additional data
        await db.collection('users').doc(userRecord.uid).set({
            name,
            email,
            verified: false,
            createdAt: new Date()
        });

        // Generate OTP and store
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await db.collection('otps').doc(email).set({
            code: otp,
            expiresAt: new Date(Date.now() + 300000) // 5 minutes
        });

        // Send email
        await sendVerificationEmail(email, otp);

        return { success: true, uid: userRecord.uid };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.verifyOTP = functions.https.onCall(async (data, context) => {
    const { email, otp } = data;

    const otpDoc = await db.collection('otps').doc(email).get();
    
    if (!otpDoc.exists || otpDoc.data().code !== otp) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid OTP');
    }

    // Mark user as verified
    const userDoc = await db.collection('users').where('email', '==', email).get();
    if (!userDoc.empty) {
        await db.collection('users').doc(userDoc.docs[0].id).update({
            verified: true
        });
    }

    // Delete OTP
    await db.collection('otps').doc(email).delete();

    return { success: true };
});
*/

// ==========================================
// RATE LIMITING EXAMPLE
// ==========================================

/*
const rateLimit = require('express-rate-limit');

// Login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// OTP verification limiter
const otpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 attempts
    message: 'Too many verification attempts. Please try again later.',
});

app.post('/api/auth/login', loginLimiter, handleLogin);
app.post('/api/auth/verify-otp', otpLimiter, handleOtpVerification);
*/

// ==========================================
// DEPLOYMENT CHECKLIST
// ==========================================
/*
✅ Database setup (MongoDB/PostgreSQL)
✅ Redis cache configured
✅ Email service configured (SendGrid/Gmail/AWS SES)
✅ JWT secrets configured
✅ CORS enabled
✅ HTTPS enforced
✅ Rate limiting implemented
✅ Error logging setup
✅ Password hashing (bcrypt)
✅ Environment variables configured
✅ Database backups scheduled
✅ Security headers added
✅ Input validation implemented
✅ Output encoding setup
✅ CSRF protection enabled
✅ API documentation created
*/
