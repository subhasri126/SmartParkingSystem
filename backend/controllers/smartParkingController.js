// =====================================================
// SMART PARKING CONTROLLER (Enhanced)
// Location-based parking search, booking, and QR codes
// =====================================================

const pool = require('../config/db');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - User latitude
 * @param {number} lng1 - User longitude
 * @param {number} lat2 - Location latitude
 * @param {number} lng2 - Location longitude
 * @returns {number} Distance in kilometers
 */
const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Generate QR code as base64 data URL
 */
const generateQRCodeDataURL = async (data) => {
    try {
        const qrDataURL = await QRCode.toDataURL(JSON.stringify(data), {
            width: 300,
            margin: 2,
            color: {
                dark: '#1a1a2e',
                light: '#ffffff'
            }
        });
        return qrDataURL;
    } catch (error) {
        console.error('QR Code generation error:', error);
        return null;
    }
};

// =====================================================
// LOCATION CONTROLLERS
// =====================================================

/**
 * @desc    Get all parking locations
 * @route   GET /api/parking/locations
 * @access  Public
 */
const getAllParkingLocations = async (req, res, next) => {
    try {
        const { city, state } = req.query;
        
        let query = 'SELECT * FROM parking_locations WHERE 1=1';
        const params = [];

        if (city) {
            query += ' AND city LIKE ?';
            params.push(`%${city}%`);
        }
        if (state) {
            query += ' AND state LIKE ?';
            params.push(`%${state}%`);
        }

        query += ' ORDER BY city, name';

        const [locations] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            count: locations.length,
            data: locations
        });
    } catch (error) {
        console.error('[getAllParkingLocations] Error:', error);
        next(error);
    }
};

/**
 * @desc    Search parking locations within radius using Haversine formula
 * @route   GET /api/parking/locations/search
 * @access  Public
 */
const searchParkingLocations = async (req, res, next) => {
    try {
        const { lat, lng, radius = 1, city } = req.query;

        if (city && !lat && !lng) {
            // Search by city name
            const [locations] = await pool.query(`
                SELECT *, 0 as distance 
                FROM parking_locations 
                WHERE city LIKE ? 
                ORDER BY available_slots DESC
            `, [`%${city}%`]);

            return res.status(200).json({
                success: true,
                count: locations.length,
                data: locations
            });
        }

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Please provide latitude and longitude, or city name'
            });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius);

        // SQL query using Haversine formula
        const [locations] = await pool.query(`
            SELECT *,
            (6371 * acos(
                cos(radians(?)) *
                cos(radians(latitude)) *
                cos(radians(longitude) - radians(?)) +
                sin(radians(?)) *
                sin(radians(latitude))
            )) AS distance
            FROM parking_locations
            HAVING distance <= ?
            ORDER BY distance ASC
        `, [userLat, userLng, userLat, searchRadius]);

        res.status(200).json({
            success: true,
            count: locations.length,
            searchParams: {
                latitude: userLat,
                longitude: userLng,
                radius: searchRadius
            },
            data: locations
        });
    } catch (error) {
        console.error('[searchParkingLocations] Error:', error);
        next(error);
    }
};

/**
 * @desc    Get parking location by ID with slots
 * @route   GET /api/parking/locations/:id
 * @access  Public
 */
const getParkingLocationById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const [locations] = await pool.query(
            'SELECT * FROM parking_locations WHERE id = ?',
            [id]
        );

        if (locations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parking location not found'
            });
        }

        const [slots] = await pool.query(
            'SELECT * FROM parking_slots_v2 WHERE location_id = ? ORDER BY slot_number',
            [id]
        );

        const [availableCount] = await pool.query(
            'SELECT COUNT(*) as count FROM parking_slots_v2 WHERE location_id = ? AND status = "available"',
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                ...locations[0],
                available_slots: availableCount[0].count,
                slots: slots
            }
        });
    } catch (error) {
        console.error('[getParkingLocationById] Error:', error);
        next(error);
    }
};

/**
 * @desc    Get available slots for a location
 * @route   GET /api/parking/locations/:id/slots
 * @access  Public
 */
const getLocationSlots = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.query;

        let query = 'SELECT * FROM parking_slots_v2 WHERE location_id = ?';
        const params = [id];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY slot_number';

        const [slots] = await pool.query(query, params);

        // Get counts
        const [counts] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied,
                SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved
            FROM parking_slots_v2 WHERE location_id = ?
        `, [id]);

        res.status(200).json({
            success: true,
            summary: counts[0],
            data: slots
        });
    } catch (error) {
        console.error('[getLocationSlots] Error:', error);
        next(error);
    }
};

// =====================================================
// BOOKING CONTROLLERS
// =====================================================

/**
 * @desc    Create a parking booking
 * @route   POST /api/parking/bookings
 * @access  Private (requires auth)
 */
const createBooking = async (req, res, next) => {
    try {
        const { location_id, slot_id, start_time, duration_hours } = req.body;
        const user_id = req.user.id;

        // Validate input
        if (!location_id || !slot_id || !start_time || !duration_hours) {
            return res.status(400).json({
                success: false,
                message: 'Please provide location_id, slot_id, start_time, and duration_hours'
            });
        }

        // Check if location exists
        const [locations] = await pool.query(
            'SELECT * FROM parking_locations WHERE id = ?',
            [location_id]
        );

        if (locations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parking location not found'
            });
        }

        const location = locations[0];

        // Check if slot exists and is available
        const [slots] = await pool.query(
            'SELECT * FROM parking_slots_v2 WHERE id = ? AND location_id = ?',
            [slot_id, location_id]
        );

        if (slots.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parking slot not found'
            });
        }

        const slot = slots[0];

        if (slot.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: `Slot is currently ${slot.status}. Please select an available slot.`,
                entryDenied: slot.status === 'occupied'
            });
        }

        // Check if location has available slots
        if (location.available_slots === 0) {
            return res.status(400).json({
                success: false,
                message: 'Entry Denied – Fully Occupied',
                entryDenied: true
            });
        }

        // Calculate booking times and amount
        const bookingStart = new Date(start_time);
        const bookingEnd = new Date(bookingStart.getTime() + (duration_hours * 60 * 60 * 1000));
        const totalAmount = location.price_per_hour * duration_hours;

        // Generate unique booking ID and QR token (UUID for verification)
        const bookingId = `VPK-${uuidv4().substring(0, 8).toUpperCase()}`;
        const qrToken = uuidv4(); // Unique UUID for QR verification

        // Generate QR code data - includes the qr_token for scanning
        const qrData = {
            booking_id: bookingId,
            qr_token: qrToken, // This is what the scanner reads
            location_name: location.name,
            slot_number: slot.slot_number,
            start_time: bookingStart.toISOString(),
            end_time: bookingEnd.toISOString(),
            amount: totalAmount,
            verify_url: `http://localhost:3000/api/verify/${qrToken}`
        };

        const qrCodeUrl = await generateQRCodeDataURL(qrData);

        // Start transaction
        await pool.query('START TRANSACTION');

        try {
            // Update slot status to reserved
            await pool.query(
                'UPDATE parking_slots_v2 SET status = "reserved" WHERE id = ?',
                [slot_id]
            );

            // Update location available slots
            await pool.query(
                'UPDATE parking_locations SET available_slots = available_slots - 1 WHERE id = ?',
                [location_id]
            );

            // Insert booking record with qr_token
            const [result] = await pool.query(`
                INSERT INTO parking_bookings 
                (user_id, location_id, slot_id, slot_number, booking_id, booking_start_time, booking_end_time, total_amount, qr_code_url, qr_token, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `, [user_id, location_id, slot_id, slot.slot_number, bookingId, bookingStart, bookingEnd, totalAmount, qrCodeUrl, qrToken]);

            await pool.query('COMMIT');

            // Get the created booking
            const [booking] = await pool.query(
                'SELECT * FROM parking_bookings WHERE id = ?',
                [result.insertId]
            );

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: {
                    ...booking[0],
                    location_name: location.name,
                    location_address: location.address,
                    qr_data: qrData
                }
            });
        } catch (txError) {
            await pool.query('ROLLBACK');
            throw txError;
        }
    } catch (error) {
        console.error('[createBooking] Error:', error);
        next(error);
    }
};

/**
 * @desc    Get user's parking bookings
 * @route   GET /api/parking/bookings
 * @access  Private (requires auth)
 */
const getUserBookings = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { status } = req.query;

        let query = `
            SELECT b.*, l.name as location_name, l.city, l.address, l.price_per_hour
            FROM parking_bookings b
            JOIN parking_locations l ON b.location_id = l.id
            WHERE b.user_id = ?
        `;
        const params = [user_id];

        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }

        query += ' ORDER BY b.created_at DESC';

        const [bookings] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('[getUserBookings] Error:', error);
        next(error);
    }
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/parking/bookings/:id
 * @access  Private (requires auth)
 */
const getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const [bookings] = await pool.query(`
            SELECT b.*, l.name as location_name, l.city, l.state, l.address, l.price_per_hour
            FROM parking_bookings b
            JOIN parking_locations l ON b.location_id = l.id
            WHERE b.id = ? AND b.user_id = ?
        `, [id, user_id]);

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bookings[0]
        });
    } catch (error) {
        console.error('[getBookingById] Error:', error);
        next(error);
    }
};

/**
 * @desc    Cancel a booking
 * @route   POST /api/parking/bookings/:id/cancel
 * @access  Private (requires auth)
 */
const cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Get the booking
        const [bookings] = await pool.query(
            'SELECT * FROM parking_bookings WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookings[0];

        if (booking.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a ${booking.status} booking`
            });
        }

        // Start transaction
        await pool.query('START TRANSACTION');

        try {
            // Update booking status
            await pool.query(
                'UPDATE parking_bookings SET status = "cancelled" WHERE id = ?',
                [id]
            );

            // Update slot status back to available
            await pool.query(
                'UPDATE parking_slots_v2 SET status = "available" WHERE id = ?',
                [booking.slot_id]
            );

            // Update location available slots
            await pool.query(
                'UPDATE parking_locations SET available_slots = available_slots + 1 WHERE id = ?',
                [booking.location_id]
            );

            await pool.query('COMMIT');

            res.status(200).json({
                success: true,
                message: 'Booking cancelled successfully'
            });
        } catch (txError) {
            await pool.query('ROLLBACK');
            throw txError;
        }
    } catch (error) {
        console.error('[cancelBooking] Error:', error);
        next(error);
    }
};

/**
 * @desc    Complete a booking (mark as completed)
 * @route   POST /api/parking/bookings/:id/complete
 * @access  Private (requires auth)
 */
const completeBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Get the booking
        const [bookings] = await pool.query(
            'SELECT * FROM parking_bookings WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookings[0];

        if (booking.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Cannot complete a ${booking.status} booking`
            });
        }

        // Start transaction
        await pool.query('START TRANSACTION');

        try {
            // Update booking status
            await pool.query(
                'UPDATE parking_bookings SET status = "completed" WHERE id = ?',
                [id]
            );

            // Update slot status back to available
            await pool.query(
                'UPDATE parking_slots_v2 SET status = "available" WHERE id = ?',
                [booking.slot_id]
            );

            // Update location available slots
            await pool.query(
                'UPDATE parking_locations SET available_slots = available_slots + 1 WHERE id = ?',
                [booking.location_id]
            );

            await pool.query('COMMIT');

            res.status(200).json({
                success: true,
                message: 'Booking completed successfully'
            });
        } catch (txError) {
            await pool.query('ROLLBACK');
            throw txError;
        }
    } catch (error) {
        console.error('[completeBooking] Error:', error);
        next(error);
    }
};

/**
 * @desc    Get parking statistics for dashboard
 * @route   GET /api/parking/stats
 * @access  Private (requires auth)
 */
const getParkingStats = async (req, res, next) => {
    try {
        const user_id = req.user.id;

        // Get user booking stats
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total_bookings,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_bookings,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
                COALESCE(SUM(CASE WHEN status IN ('active', 'completed') THEN total_amount ELSE 0 END), 0) as total_spent
            FROM parking_bookings WHERE user_id = ?
        `, [user_id]);

        // Get recent bookings
        const [recentBookings] = await pool.query(`
            SELECT b.*, l.name as location_name, l.city
            FROM parking_bookings b
            JOIN parking_locations l ON b.location_id = l.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT 5
        `, [user_id]);

        res.status(200).json({
            success: true,
            data: {
                stats: stats[0],
                recentBookings: recentBookings
            }
        });
    } catch (error) {
        console.error('[getParkingStats] Error:', error);
        next(error);
    }
};

/**
 * @desc    Get all cities with parking locations
 * @route   GET /api/parking/cities
 * @access  Public
 */
const getParkingCities = async (req, res, next) => {
    try {
        const [cities] = await pool.query(`
            SELECT DISTINCT city, state, COUNT(*) as location_count
            FROM parking_locations
            GROUP BY city, state
            ORDER BY state, city
        `);

        res.status(200).json({
            success: true,
            count: cities.length,
            data: cities
        });
    } catch (error) {
        console.error('[getParkingCities] Error:', error);
        next(error);
    }
};

/**
 * @desc    Simulate real-time slot availability update
 * @route   POST /api/parking/locations/:id/simulate
 * @access  Public (for demo purposes)
 */
const simulateSlotChanges = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get all slots for location
        const [slots] = await pool.query(
            'SELECT * FROM parking_slots_v2 WHERE location_id = ?',
            [id]
        );

        if (slots.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No slots found for this location'
            });
        }

        // Randomly change 1-3 slot statuses
        const changesToMake = Math.floor(Math.random() * 3) + 1;
        const changes = [];

        for (let i = 0; i < changesToMake; i++) {
            const randomSlot = slots[Math.floor(Math.random() * slots.length)];
            
            // Don't change reserved slots
            if (randomSlot.status === 'reserved') continue;

            const newStatus = randomSlot.status === 'available' ? 'occupied' : 'available';
            
            await pool.query(
                'UPDATE parking_slots_v2 SET status = ? WHERE id = ?',
                [newStatus, randomSlot.id]
            );

            changes.push({
                slot: randomSlot.slot_number,
                oldStatus: randomSlot.status,
                newStatus: newStatus
            });
        }

        // Update location available slots count
        const [availableCount] = await pool.query(
            'SELECT COUNT(*) as count FROM parking_slots_v2 WHERE location_id = ? AND status = "available"',
            [id]
        );

        await pool.query(
            'UPDATE parking_locations SET available_slots = ? WHERE id = ?',
            [availableCount[0].count, id]
        );

        res.status(200).json({
            success: true,
            message: 'Slot status simulation completed',
            changes: changes,
            updatedAvailableSlots: availableCount[0].count
        });
    } catch (error) {
        console.error('[simulateSlotChanges] Error:', error);
        next(error);
    }
};

module.exports = {
    getAllParkingLocations,
    searchParkingLocations,
    getParkingLocationById,
    getLocationSlots,
    createBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    completeBooking,
    getParkingStats,
    getParkingCities,
    simulateSlotChanges,
    verifyQRToken,
    getBookingByQRToken
};

// =====================================================
// QR VERIFICATION CONTROLLERS
// For ESP32/Python gate access control
// =====================================================

/**
 * @desc    Verify QR token for gate access
 * @route   GET /api/smart-parking/verify/:qr_token
 * @access  Public (called by Python/ESP32 scanner)
 */
async function verifyQRToken(req, res, next) {
    try {
        const { qr_token } = req.params;
        
        console.log(`[verifyQRToken] Verifying QR token: ${qr_token}`);

        if (!qr_token) {
            return res.status(400).json({
                success: false,
                action: 'DENY',
                message: 'QR token is required'
            });
        }

        // Find booking by QR token
        const [bookings] = await pool.query(`
            SELECT pb.*, pl.name as location_name, ps.slot_number, ps.status as slot_status
            FROM parking_bookings pb
            JOIN parking_locations pl ON pb.location_id = pl.id
            JOIN parking_slots_v2 ps ON pb.slot_id = ps.id
            WHERE pb.qr_token = ?
        `, [qr_token]);

        if (bookings.length === 0) {
            console.log(`[verifyQRToken] Invalid token: ${qr_token}`);
            return res.status(404).json({
                success: false,
                action: 'DENY',
                message: 'Invalid QR code - Booking not found'
            });
        }

        const booking = bookings[0];
        const now = new Date();
        const startTime = new Date(booking.booking_start_time);
        const endTime = new Date(booking.booking_end_time);

        // Check if booking is active
        if (booking.status !== 'active') {
            console.log(`[verifyQRToken] Booking not active: ${booking.status}`);
            return res.status(400).json({
                success: false,
                action: 'DENY',
                message: `Booking is ${booking.status}`
            });
        }

        // Check if booking is within valid time window (allow 24 hours early for testing, 30 min late)
        const earlyWindow = new Date(startTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours early
        const lateWindow = new Date(endTime.getTime() + 30 * 60 * 1000);

        if (now < earlyWindow) {
            console.log(`[verifyQRToken] Too early for booking`);
            return res.status(400).json({
                success: false,
                action: 'DENY',
                message: `Booking starts at ${startTime.toLocaleString()}. Entry allowed 24 hours before.`
            });
        }

        if (now > lateWindow) {
            console.log(`[verifyQRToken] Booking has expired`);
            return res.status(400).json({
                success: false,
                action: 'DENY',
                message: 'Booking has expired'
            });
        }

        // Determine if this is entry or exit
        const isEntry = !booking.entry_time;
        const action = isEntry ? 'entry' : 'exit';

        // Update booking record
        if (isEntry) {
            await pool.query(`
                UPDATE parking_bookings 
                SET qr_verified = TRUE, qr_verified_at = NOW(), entry_time = NOW()
                WHERE id = ?
            `, [booking.id]);

            // Update slot status to occupied
            await pool.query(
                'UPDATE parking_slots_v2 SET status = "occupied" WHERE id = ?',
                [booking.slot_id]
            );
        } else {
            await pool.query(`
                UPDATE parking_bookings 
                SET exit_time = NOW(), status = 'completed'
                WHERE id = ?
            `, [booking.id]);

            // Update slot status to available
            await pool.query(
                'UPDATE parking_slots_v2 SET status = "available" WHERE id = ?',
                [booking.slot_id]
            );

            // Update location available slots
            await pool.query(
                'UPDATE parking_locations SET available_slots = available_slots + 1 WHERE id = ?',
                [booking.location_id]
            );
        }

        // Log access
        await pool.query(`
            INSERT INTO parking_access_logs (booking_id, qr_token, action, gate_id)
            VALUES (?, ?, ?, 'GATE-01')
        `, [booking.id, qr_token, action]);

        console.log(`[verifyQRToken] SUCCESS - ${action.toUpperCase()} granted for booking ${booking.booking_id}`);

        res.status(200).json({
            success: true,
            action: 'OPEN',
            gate_action: action,
            message: `${action === 'entry' ? 'Welcome!' : 'Thank you!'} Gate opening...`,
            data: {
                booking_id: booking.booking_id,
                slot_number: booking.slot_number,
                location: booking.location_name,
                valid_until: endTime.toLocaleString()
            }
        });

    } catch (error) {
        console.error('[verifyQRToken] Error:', error);
        res.status(500).json({
            success: false,
            action: 'DENY',
            message: 'Server error during verification'
        });
    }
}

/**
 * @desc    Get booking details by QR token (for display)
 * @route   GET /api/smart-parking/booking-by-qr/:qr_token
 * @access  Public
 */
async function getBookingByQRToken(req, res, next) {
    try {
        const { qr_token } = req.params;

        const [bookings] = await pool.query(`
            SELECT pb.*, pl.name as location_name, pl.address, pl.city
            FROM parking_bookings pb
            JOIN parking_locations pl ON pb.location_id = pl.id
            WHERE pb.qr_token = ?
        `, [qr_token]);

        if (bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bookings[0]
        });

    } catch (error) {
        console.error('[getBookingByQRToken] Error:', error);
        next(error);
    }
}
