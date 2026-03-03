// =====================================================
// INIT SMART PARKING TABLES
// Creates all required tables for smart parking
// =====================================================

const pool = require('./config/db');

const initSmartParkingTables = async () => {
    try {
        console.log('🚗 Initializing Smart Parking tables...\n');

        // Create legacy parking_slots table (for backward compatibility with old parking page)
        console.log('Creating parking_slots table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parking_slots (
                id INT PRIMARY KEY AUTO_INCREMENT,
                slot_number INT NOT NULL UNIQUE,
                status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_slot_number (slot_number)
            )
        `);

        // Create parking_logs table for legacy system
        console.log('Creating parking_logs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parking_logs (
                log_id INT PRIMARY KEY AUTO_INCREMENT,
                slot_id INT NOT NULL,
                status ENUM('available', 'occupied', 'reserved') NOT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_slot_id (slot_id),
                INDEX idx_changed_at (changed_at),
                INDEX idx_status (status)
            )
        `);

        // Insert initial parking slots for legacy system if empty
        const [existingSlots] = await pool.query('SELECT COUNT(*) as count FROM parking_slots');
        if (existingSlots[0].count === 0) {
            console.log('Seeding legacy parking_slots...');
            const slots = [];
            for (let i = 1; i <= 20; i++) {
                const rand = Math.random();
                let status = 'available';
                if (rand > 0.8) status = 'occupied';
                else if (rand > 0.7) status = 'reserved';
                slots.push(`(${i}, '${status}')`);
            }
            await pool.query(`INSERT INTO parking_slots (slot_number, status) VALUES ${slots.join(', ')}`);
        }

        // Create parking_locations table
        console.log('Creating parking_locations table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parking_locations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                total_slots INT NOT NULL DEFAULT 20,
                available_slots INT NOT NULL DEFAULT 20,
                address TEXT,
                price_per_hour DECIMAL(10, 2) DEFAULT 20.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_city (city),
                INDEX idx_state (state),
                INDEX idx_lat_lng (latitude, longitude)
            )
        `);

        // Create parking_slots_v2 table
        console.log('Creating parking_slots_v2 table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parking_slots_v2 (
                id INT PRIMARY KEY AUTO_INCREMENT,
                location_id INT NOT NULL,
                slot_number VARCHAR(20) NOT NULL,
                status ENUM('available', 'occupied', 'reserved') DEFAULT 'available',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_location_id (location_id),
                INDEX idx_status (status),
                UNIQUE KEY unique_location_slot (location_id, slot_number)
            )
        `);

        // Create parking_bookings table
        console.log('Creating parking_bookings table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parking_bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                location_id INT NOT NULL,
                slot_id INT NOT NULL,
                slot_number VARCHAR(20) NOT NULL,
                booking_id VARCHAR(50) NOT NULL UNIQUE,
                booking_start_time DATETIME NOT NULL,
                booking_end_time DATETIME NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                qr_code_url LONGTEXT,
                status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_location_id (location_id),
                INDEX idx_booking_id (booking_id),
                INDEX idx_status (status),
                INDEX idx_booking_time (booking_start_time, booking_end_time)
            )
        `);

        console.log('\n✅ All Smart Parking tables created successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error initializing tables:', error);
        process.exit(1);
    }
};

// Run if executed directly
if (require.main === module) {
    initSmartParkingTables();
}

module.exports = { initSmartParkingTables };
