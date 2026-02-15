// =====================================================
// EMAIL SERVICE
// Send emails using Nodemailer
// =====================================================

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration
const verifyEmailService = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email Service Ready');
        return true;
    } catch (error) {
        console.error('❌ Email Service Error:', error.message);
        return false;
    }
};

// Send OTP Email
const sendOTPEmail = async (email, otpCode, fullName) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Voyago - Email Verification Code',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .otp-box {
                        background: #f8f9fa;
                        border: 2px dashed #667eea;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .otp-code {
                        font-size: 36px;
                        font-weight: bold;
                        color: #667eea;
                        letter-spacing: 8px;
                        margin: 10px 0;
                    }
                    .warning {
                        background: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background: #667eea;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✈️ Voyago</h1>
                        <p>Your Journey Begins Here</p>
                    </div>
                    <div class="content">
                        <h2>Hello ${fullName || 'Traveler'}! 👋</h2>
                        <p>Thank you for registering with Voyago. To complete your registration, please verify your email address using the code below:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0; color: #666;">Your Verification Code</p>
                            <div class="otp-code">${otpCode}</div>
                        </div>

                        <p><strong>This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.</strong></p>

                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong>
                            <p style="margin: 5px 0 0 0;">Never share this code with anyone. Voyago will never ask for your OTP via phone or email.</p>
                        </div>

                        <p>If you didn't request this code, please ignore this email or contact our support team.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 Voyago. All rights reserved.</p>
                        <p>Explore the World Smarter</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ OTP Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        throw error;
    }
};

// Send Welcome Email (after verification)
const sendWelcomeEmail = async (email, fullName) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Welcome to Voyago! 🎉',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        color: #666;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Welcome to Voyago!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${fullName}! 👋</h2>
                        <p>Your email has been successfully verified. You're all set to start exploring amazing destinations!</p>
                        <p>With Voyago, you can:</p>
                        <ul>
                            <li>🌍 Discover breathtaking destinations</li>
                            <li>🏨 Find the best hotels and accommodations</li>
                            <li>🍽️ Explore local restaurants and cuisines</li>
                            <li>✈️ Plan your dream trips effortlessly</li>
                        </ul>
                        <p>Start your journey today!</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 Voyago. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent');
    } catch (error) {
        console.error('❌ Welcome email failed:', error.message);
        // Don't throw error for welcome email
    }
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    verifyEmailService
};
