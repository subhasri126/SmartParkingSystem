// =====================================================
// USER MODEL
// Handle all database operations for users
// =====================================================

const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Create new user
    static async create(userData) {
        const { full_name, email, password } = userData;
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const query = `
            INSERT INTO users (full_name, email, password) 
            VALUES (?, ?, ?)
        `;
        
        const [result] = await pool.execute(query, [full_name, email, hashedPassword]);
        return result.insertId;
    }

    // Find user by email
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);
        return rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const query = 'SELECT id, full_name, email, is_verified, created_at FROM users WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    // Update OTP
    static async updateOTP(email, otpCode, otpExpiry) {
        const query = `
            UPDATE users 
            SET otp_code = ?, otp_expiry = ?, last_otp_sent = NOW() 
            WHERE email = ?
        `;
        
        const [result] = await pool.execute(query, [otpCode, otpExpiry, email]);
        return result.affectedRows > 0;
    }

    // Verify OTP
    static async verifyOTP(email, otpCode) {
        const query = `
            SELECT * FROM users 
            WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()
        `;
        
        const [rows] = await pool.execute(query, [email, otpCode]);
        return rows[0];
    }

    // Mark user as verified
    static async markAsVerified(email) {
        const query = `
            UPDATE users 
            SET is_verified = TRUE, otp_code = NULL, otp_expiry = NULL 
            WHERE email = ?
        `;
        
        const [result] = await pool.execute(query, [email]);
        return result.affectedRows > 0;
    }

    // Compare password
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Check if OTP can be resent (cooldown check)
    static async canResendOTP(email) {
        const cooldownSeconds = process.env.RESEND_OTP_COOLDOWN_SECONDS || 30;
        
        const query = `
            SELECT last_otp_sent 
            FROM users 
            WHERE email = ? AND last_otp_sent IS NOT NULL
        `;
        
        const [rows] = await pool.execute(query, [email]);
        
        if (rows.length === 0) return true;
        
        const lastSent = new Date(rows[0].last_otp_sent);
        const now = new Date();
        const diffSeconds = (now - lastSent) / 1000;
        
        return diffSeconds >= cooldownSeconds;
    }

    // Get time until OTP can be resent
    static async getResendCooldownRemaining(email) {
        const cooldownSeconds = process.env.RESEND_OTP_COOLDOWN_SECONDS || 30;
        
        const query = `
            SELECT last_otp_sent 
            FROM users 
            WHERE email = ?
        `;
        
        const [rows] = await pool.execute(query, [email]);
        
        if (rows.length === 0 || !rows[0].last_otp_sent) return 0;
        
        const lastSent = new Date(rows[0].last_otp_sent);
        const now = new Date();
        const diffSeconds = (now - lastSent) / 1000;
        const remaining = Math.max(0, cooldownSeconds - Math.floor(diffSeconds));
        
        return remaining;
    }
}

module.exports = User;
