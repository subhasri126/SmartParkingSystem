require('dotenv').config();
const nodemailer = require('nodemailer');

async function debugEmail() {
    console.log('--- Debugging Email Service ---');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);

    // Create transporter with the exact same config as emailService.js
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
        },
        debug: true, // Enable debug output
        logger: true // Log to console
    });

    try {
        console.log('Verifying transporter...');
        await transporter.verify();
        console.log('✅ Transporter verified.');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Debug Test Email',
            text: 'If you see this, email sending is working.'
        });
        console.log('✅ Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ Error occurred:');
        console.error('Code:', error.code);
        console.error('Command:', error.command);
        console.error('Message:', error.message);
        console.error('Response:', error.response);
    }
}

debugEmail();
