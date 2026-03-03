// =====================================================
// INITIALIZE QR VERIFICATION TABLES
// Run this script to add QR verification support
// Usage: node init-qr-verification.js
// =====================================================

const pool = require('./config/db');

const initQRVerificationTables = async () => {
    console.log('\n🔧 Initializing QR Verification Tables...');
    console.log('━'.repeat(60));

    try {
        // Add qr_token column to parking_bookings if not exists
        console.log('📊 Adding qr_token column to parking_bookings...');
        
        // Check if column exists
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'parking_bookings' 
            AND COLUMN_NAME = 'qr_token'
        `);

        if (columns.length === 0) {
            await pool.query(`
                ALTER TABLE parking_bookings 
                ADD COLUMN qr_token VARCHAR(36) UNIQUE AFTER qr_code_url,
                ADD COLUMN qr_verified BOOLEAN DEFAULT FALSE AFTER qr_token,
                ADD COLUMN qr_verified_at DATETIME NULL AFTER qr_verified,
                ADD COLUMN entry_time DATETIME NULL AFTER qr_verified_at,
                ADD COLUMN exit_time DATETIME NULL AFTER entry_time,
                ADD INDEX idx_qr_token (qr_token)
            `);
            console.log('✅ Added qr_token columns to parking_bookings');
        } else {
            console.log('ℹ️  qr_token column already exists');
        }

        // Create parking_access_logs table
        console.log('📊 Creating parking_access_logs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parking_access_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                qr_token VARCHAR(36) NOT NULL,
                action ENUM('entry', 'exit') NOT NULL,
                gate_id VARCHAR(50) DEFAULT 'GATE-01',
                verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_booking_id (booking_id),
                INDEX idx_qr_token (qr_token),
                INDEX idx_action (action)
            )
        `);
        console.log('✅ parking_access_logs table ready');

        // Update existing bookings without qr_token
        console.log('📊 Generating QR tokens for existing bookings...');
        const [bookingsWithoutToken] = await pool.query(`
            SELECT id FROM parking_bookings WHERE qr_token IS NULL OR qr_token = ''
        `);

        if (bookingsWithoutToken.length > 0) {
            const { v4: uuidv4 } = require('uuid');
            
            for (const booking of bookingsWithoutToken) {
                const qrToken = uuidv4();
                await pool.query(
                    'UPDATE parking_bookings SET qr_token = ? WHERE id = ?',
                    [qrToken, booking.id]
                );
            }
            console.log(`✅ Generated QR tokens for ${bookingsWithoutToken.length} existing bookings`);
        } else {
            console.log('ℹ️  All bookings already have QR tokens');
        }

        // Display summary
        console.log('\n' + '═'.repeat(60));
        console.log('✅ QR VERIFICATION SETUP COMPLETE');
        console.log('═'.repeat(60));
        
        // Show table info
        const [bookingCount] = await pool.query('SELECT COUNT(*) as count FROM parking_bookings');
        const [accessLogCount] = await pool.query('SELECT COUNT(*) as count FROM parking_access_logs');
        
        console.log('\n📊 Database Summary:');
        console.log(`   Total Bookings: ${bookingCount[0].count}`);
        console.log(`   Access Logs: ${accessLogCount[0].count}`);
        
        // Show API endpoints
        console.log('\n📡 API Endpoints:');
        console.log('   GET  /api/smart-parking/verify/:qr_token     - Verify QR for gate access');
        console.log('   GET  /api/smart-parking/booking-by-qr/:token - Get booking by QR token');
        
        console.log('\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error initializing QR verification:', error);
        process.exit(1);
    }
};

// Run initialization
initQRVerificationTables();
