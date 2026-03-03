// =====================================================
// SEED PARKING LOCATIONS DATA
// Tamil Nadu parking locations for initial deployment
// Scalable for pan-India expansion
// =====================================================

const pool = require('./config/db');

const parkingLocations = [
    // Chennai - 3 locations
    {
        name: 'Chennai Central Railway Parking',
        city: 'Chennai',
        state: 'Tamil Nadu',
        latitude: 13.0827,
        longitude: 80.2707,
        total_slots: 50,
        address: 'Near Chennai Central Railway Station, Park Town',
        price_per_hour: 30.00
    },
    {
        name: 'Marina Beach Parking Zone',
        city: 'Chennai',
        state: 'Tamil Nadu',
        latitude: 13.0500,
        longitude: 80.2824,
        total_slots: 80,
        address: 'Marina Beach Road, Triplicane',
        price_per_hour: 25.00
    },
    {
        name: 'Phoenix Mall Parking',
        city: 'Chennai',
        state: 'Tamil Nadu',
        latitude: 12.9922,
        longitude: 80.2151,
        total_slots: 200,
        address: 'Velachery Main Road, Velachery',
        price_per_hour: 40.00
    },
    // Coimbatore - 3 locations
    {
        name: 'Coimbatore Junction Parking',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        latitude: 11.0168,
        longitude: 76.9558,
        total_slots: 40,
        address: 'Near Coimbatore Railway Junction',
        price_per_hour: 20.00
    },
    {
        name: 'Brookefields Mall Parking',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        latitude: 11.0245,
        longitude: 76.9662,
        total_slots: 150,
        address: 'Brookefields, Avinashi Road',
        price_per_hour: 35.00
    },
    {
        name: 'VOC Park Parking Zone',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        latitude: 11.0113,
        longitude: 76.9657,
        total_slots: 30,
        address: 'VOC Park Road, Coimbatore',
        price_per_hour: 15.00
    },
    // Madurai - 3 locations
    {
        name: 'Meenakshi Temple Parking',
        city: 'Madurai',
        state: 'Tamil Nadu',
        latitude: 9.9195,
        longitude: 78.1193,
        total_slots: 100,
        address: 'Near Meenakshi Amman Temple',
        price_per_hour: 25.00
    },
    {
        name: 'Madurai Junction Parking',
        city: 'Madurai',
        state: 'Tamil Nadu',
        latitude: 9.9196,
        longitude: 78.1246,
        total_slots: 45,
        address: 'Near Madurai Railway Junction',
        price_per_hour: 20.00
    },
    {
        name: 'Vishaal Shopping Mall Parking',
        city: 'Madurai',
        state: 'Tamil Nadu',
        latitude: 9.9330,
        longitude: 78.1170,
        total_slots: 80,
        address: 'Bypass Road, Madurai',
        price_per_hour: 30.00
    },
    // Trichy - 2 locations
    {
        name: 'Rock Fort Temple Parking',
        city: 'Tiruchirappalli',
        state: 'Tamil Nadu',
        latitude: 10.8050,
        longitude: 78.6856,
        total_slots: 60,
        address: 'Near Rock Fort Temple, Trichy',
        price_per_hour: 20.00
    },
    {
        name: 'Trichy Central Bus Stand Parking',
        city: 'Tiruchirappalli',
        state: 'Tamil Nadu',
        latitude: 10.8123,
        longitude: 78.6882,
        total_slots: 50,
        address: 'Central Bus Stand, Trichy',
        price_per_hour: 15.00
    },
    // Salem - 2 locations
    {
        name: 'Salem Junction Parking',
        city: 'Salem',
        state: 'Tamil Nadu',
        latitude: 11.6643,
        longitude: 78.1460,
        total_slots: 35,
        address: 'Near Salem Railway Junction',
        price_per_hour: 15.00
    },
    {
        name: 'Salem Municipal Complex Parking',
        city: 'Salem',
        state: 'Tamil Nadu',
        latitude: 11.6556,
        longitude: 78.1582,
        total_slots: 40,
        address: 'Municipal Office Road, Salem',
        price_per_hour: 20.00
    },
    // Ooty - 3 locations
    {
        name: 'Ooty Lake Parking',
        city: 'Ooty',
        state: 'Tamil Nadu',
        latitude: 11.4064,
        longitude: 76.6932,
        total_slots: 80,
        address: 'Near Ooty Lake, Ooty',
        price_per_hour: 30.00
    },
    {
        name: 'Botanical Garden Parking',
        city: 'Ooty',
        state: 'Tamil Nadu',
        latitude: 11.4169,
        longitude: 76.6987,
        total_slots: 50,
        address: 'Vannarapettai, Near Botanical Garden',
        price_per_hour: 25.00
    },
    {
        name: 'Ooty Bus Stand Parking',
        city: 'Ooty',
        state: 'Tamil Nadu',
        latitude: 11.4102,
        longitude: 76.6950,
        total_slots: 35,
        address: 'Main Bus Stand, Ooty',
        price_per_hour: 20.00
    },
    // Thanjavur - 2 locations
    {
        name: 'Brihadeeswarar Temple Parking',
        city: 'Thanjavur',
        state: 'Tamil Nadu',
        latitude: 10.7828,
        longitude: 79.1318,
        total_slots: 70,
        address: 'Near Big Temple, Thanjavur',
        price_per_hour: 20.00
    },
    {
        name: 'Thanjavur Palace Parking',
        city: 'Thanjavur',
        state: 'Tamil Nadu',
        latitude: 10.7867,
        longitude: 79.1378,
        total_slots: 40,
        address: 'Near Royal Palace, Thanjavur',
        price_per_hour: 15.00
    },
    // Kanyakumari - 2 locations
    {
        name: 'Vivekananda Rock Memorial Parking',
        city: 'Kanyakumari',
        state: 'Tamil Nadu',
        latitude: 8.0774,
        longitude: 77.5500,
        total_slots: 100,
        address: 'Beach Road, Kanyakumari',
        price_per_hour: 25.00
    },
    {
        name: 'Kanyakumari Temple Parking',
        city: 'Kanyakumari',
        state: 'Tamil Nadu',
        latitude: 8.0785,
        longitude: 77.5539,
        total_slots: 50,
        address: 'Near Kumari Amman Temple',
        price_per_hour: 20.00
    }
];

// Function to generate slot numbers for a location
const generateSlots = (locationId, totalSlots) => {
    const slots = [];
    for (let i = 1; i <= totalSlots; i++) {
        // Random initial status (80% available, 15% occupied, 5% reserved)
        const rand = Math.random();
        let status = 'available';
        if (rand > 0.85) {
            status = 'occupied';
        } else if (rand > 0.80) {
            status = 'reserved';
        }
        
        slots.push({
            location_id: locationId,
            slot_number: `P${String(i).padStart(3, '0')}`,
            status: status
        });
    }
    return slots;
};

const seedParkingData = async () => {
    try {
        console.log('🚗 Starting parking data seed...\n');

        // First, run the schema to create tables
        console.log('📋 Ensuring tables exist...');
        
        // Create parking_locations table
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
                qr_code_url TEXT,
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

        // Clear existing data
        console.log('🧹 Clearing existing parking data...');
        await pool.query('DELETE FROM parking_bookings');
        await pool.query('DELETE FROM parking_slots_v2');
        await pool.query('DELETE FROM parking_locations');

        // Insert parking locations
        console.log('📍 Inserting parking locations...');
        for (const location of parkingLocations) {
            const [result] = await pool.query(`
                INSERT INTO parking_locations (name, city, state, latitude, longitude, total_slots, available_slots, address, price_per_hour)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [location.name, location.city, location.state, location.latitude, location.longitude, 
                location.total_slots, location.total_slots, location.address, location.price_per_hour]);

            const locationId = result.insertId;

            // Generate and insert slots for this location
            const slots = generateSlots(locationId, location.total_slots);
            for (const slot of slots) {
                await pool.query(`
                    INSERT INTO parking_slots_v2 (location_id, slot_number, status)
                    VALUES (?, ?, ?)
                `, [slot.location_id, slot.slot_number, slot.status]);
            }

            // Update available_slots count based on actual slot statuses
            const [availableCount] = await pool.query(`
                SELECT COUNT(*) as count FROM parking_slots_v2 
                WHERE location_id = ? AND status = 'available'
            `, [locationId]);

            await pool.query(`
                UPDATE parking_locations SET available_slots = ? WHERE id = ?
            `, [availableCount[0].count, locationId]);

            console.log(`   ✅ ${location.name} - ${location.total_slots} slots created`);
        }

        // Summary
        const [locationCount] = await pool.query('SELECT COUNT(*) as count FROM parking_locations');
        const [slotCount] = await pool.query('SELECT COUNT(*) as count FROM parking_slots_v2');
        const [availableSlots] = await pool.query('SELECT COUNT(*) as count FROM parking_slots_v2 WHERE status = "available"');

        console.log('\n========================================');
        console.log('🎉 Parking data seeded successfully!');
        console.log('========================================');
        console.log(`📍 Total locations: ${locationCount[0].count}`);
        console.log(`🅿️  Total slots: ${slotCount[0].count}`);
        console.log(`✅ Available slots: ${availableSlots[0].count}`);
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding parking data:', error);
        process.exit(1);
    }
};

// Run if executed directly
if (require.main === module) {
    seedParkingData();
}

module.exports = { seedParkingData, parkingLocations };
