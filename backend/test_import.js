require('dotenv').config();
const { sendOTPEmail } = require('./utils/emailService');

async function testImport() {
    console.log('Testing imported email service...');
    try {
        await sendOTPEmail(process.env.EMAIL_USER, '123456', 'Test User');
        console.log('✅ Email sent successfully via module import');
    } catch (error) {
        console.error('❌ Failed to send email via module:', error);
    }
}

testImport();
