// =====================================================
// PARKING DATABASE INITIALIZATION SCRIPT
// Run this script to create and seed parking tables
// =====================================================

const pool = require('./config/db');

const initParkingTables = async () => {
    console.log('\n🔧 Initializing Smart Parking Database Tables...');
    console.log('━'.repeat(60));

    try {
        // Create parking_slots table
        console.log('📊 Creating parking_slots table...');
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
        console.log('✅ parking_slots table created');

        // Create parking_logs table
        console.log('📊 Creating parking_logs table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parking_logs (
                log_id INT PRIMARY KEY AUTO_INCREMENT,
                slot_id INT NOT NULL,
                status ENUM('available', 'occupied', 'reserved') NOT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_slot_id (slot_id),
                INDEX idx_changed_at (changed_at),
                INDEX idx_status (status),
                FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ parking_logs table created');

        // Check if parking slots already exist
        const [existingSlots] = await pool.query('SELECT COUNT(*) as count FROM parking_slots');
        
        if (existingSlots[0].count === 0) {
            console.log('\n📦 Seeding initial parking slots...');
            
            // Insert 20 parking slots with varied statuses
            const slots = [
                { number: 1, status: 'available' },
                { number: 2, status: 'available' },
                { number: 3, status: 'occupied' },
                { number: 4, status: 'available' },
                { number: 5, status: 'reserved' },
                { number: 6, status: 'available' },
                { number: 7, status: 'occupied' },
                { number: 8, status: 'available' },
                { number: 9, status: 'available' },
                { number: 10, status: 'occupied' },
                { number: 11, status: 'available' },
                { number: 12, status: 'available' },
                { number: 13, status: 'occupied' },
                { number: 14, status: 'available' },
                { number: 15, status: 'available' },
                { number: 16, status: 'reserved' },
                { number: 17, status: 'available' },
                { number: 18, status: 'occupied' },
                { number: 19, status: 'available' },
                { number: 20, status: 'available' }
            ];

            for (const slot of slots) {
                await pool.query(
                    'INSERT INTO parking_slots (slot_number, status) VALUES (?, ?)',
                    [slot.number, slot.status]
                );
            }
            console.log('✅ Inserted 20 parking slots');

            // Insert sample parking logs for analytics
            console.log('\n📦 Seeding sample parking logs...');
            const sampleLogs = [
                { slot_id: 1, status: 'occupied', hours_ago: 48 },
                { slot_id: 1, status: 'available', hours_ago: 46 },
                { slot_id: 2, status: 'occupied', hours_ago: 24 },
                { slot_id: 2, status: 'available', hours_ago: 21 },
                { slot_id: 3, status: 'occupied', hours_ago: 12 },
                { slot_id: 4, status: 'reserved', hours_ago: 6 },
                { slot_id: 4, status: 'occupied', hours_ago: 5 },
                { slot_id: 4, status: 'available', hours_ago: 4 },
                { slot_id: 5, status: 'reserved', hours_ago: 3 },
                { slot_id: 6, status: 'occupied', hours_ago: 2 },
                { slot_id: 6, status: 'available', hours_ago: 1 },
                { slot_id: 7, status: 'occupied', hours_ago: 0.5 },
                { slot_id: 10, status: 'occupied', hours_ago: 0.33 },
                { slot_id: 3, status: 'occupied', hours_ago: 36 },
                { slot_id: 3, status: 'available', hours_ago: 34 },
                { slot_id: 5, status: 'occupied', hours_ago: 30 },
                { slot_id: 5, status: 'available', hours_ago: 28 },
                { slot_id: 8, status: 'occupied', hours_ago: 20 },
                { slot_id: 8, status: 'available', hours_ago: 18 },
                { slot_id: 9, status: 'reserved', hours_ago: 15 },
                { slot_id: 9, status: 'occupied', hours_ago: 14 },
                { slot_id: 9, status: 'available', hours_ago: 13 }
            ];

            for (const log of sampleLogs) {
                await pool.query(
                    `INSERT INTO parking_logs (slot_id, status, changed_at) 
                     VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
                    [log.slot_id, log.status, log.hours_ago]
                );
            }
            console.log('✅ Inserted sample parking logs');
        } else {
            console.log('ℹ️  Parking slots already exist, skipping seed data');
        }

        console.log('\n' + '═'.repeat(60));
        console.log('✅ SMART PARKING DATABASE INITIALIZATION COMPLETE');
        console.log('═'.repeat(60));

        // Display summary
        const [slotCount] = await pool.query('SELECT COUNT(*) as count FROM parking_slots');
        const [logCount] = await pool.query('SELECT COUNT(*) as count FROM parking_logs');
        const [availableCount] = await pool.query('SELECT COUNT(*) as count FROM parking_slots WHERE status = "available"');
        const [occupiedCount] = await pool.query('SELECT COUNT(*) as count FROM parking_slots WHERE status = "occupied"');
        const [reservedCount] = await pool.query('SELECT COUNT(*) as count FROM parking_slots WHERE status = "reserved"');

        console.log('\n📊 Database Summary:');
        console.log(`   Total Slots: ${slotCount[0].count}`);
        console.log(`   Available: ${availableCount[0].count}`);
        console.log(`   Occupied: ${occupiedCount[0].count}`);
        console.log(`   Reserved: ${reservedCount[0].count}`);
        console.log(`   Total Logs: ${logCount[0].count}`);
        console.log('\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error initializing parking tables:', error.message);
        console.error(error);
        process.exit(1);
    }
};

// Run the initialization
initParkingTables();
