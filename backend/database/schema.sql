-- =====================================================
-- VOYAGO AUTHENTICATION DATABASE SCHEMA
-- =====================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS voyago_db;
USE voyago_db;

-- Drop existing table if exists (for development)
DROP TABLE IF EXISTS users;

-- Create Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(6) DEFAULT NULL,
    otp_expiry DATETIME DEFAULT NULL,
    last_otp_sent DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Index for faster OTP lookups
CREATE INDEX idx_otp_code ON users(otp_code);

-- Optional: Create sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    device_info VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- View all users
-- SELECT id, full_name, email, is_verified, created_at FROM users;

-- Check OTP for a user
-- SELECT email, otp_code, otp_expiry FROM users WHERE email = 'test@example.com';

-- Delete all unverified users (cleanup)
-- DELETE FROM users WHERE is_verified = FALSE AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Reset a user's verification status (for testing)
-- UPDATE users SET is_verified = FALSE, otp_code = NULL, otp_expiry = NULL WHERE email = 'test@example.com';
