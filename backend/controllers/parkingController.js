// =====================================================
// PARKING CONTROLLER
// Handle all smart parking-related logic
// =====================================================

const pool = require('../config/db');

// Store active reservation timers
const reservationTimers = new Map();

// @desc    Get parking summary (total, available, occupied, last updated)
// @route   GET /api/parking/summary
// @access  Public
const getParkingSummary = async (req, res, next) => {
    try {
        console.log('[getParkingSummary] Fetching parking summary');

        const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM parking_slots');
        const [availableResult] = await pool.query('SELECT COUNT(*) as available FROM parking_slots WHERE status = "available"');
        const [occupiedResult] = await pool.query('SELECT COUNT(*) as occupied FROM parking_slots WHERE status = "occupied"');
        const [reservedResult] = await pool.query('SELECT COUNT(*) as reserved FROM parking_slots WHERE status = "reserved"');
        const [lastUpdatedResult] = await pool.query('SELECT MAX(last_updated) as lastUpdated FROM parking_slots');

        const summary = {
            total: totalResult[0].total,
            available: availableResult[0].available,
            occupied: occupiedResult[0].occupied,
            reserved: reservedResult[0].reserved,
            lastUpdated: lastUpdatedResult[0].lastUpdated
        };

        console.log('[getParkingSummary] Summary:', summary);

        res.status(200).json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('[getParkingSummary] Error:', error);
        next(error);
    }
};

// @desc    Get all parking slots
// @route   GET /api/parking
// @access  Public
const getAllParkingSlots = async (req, res, next) => {
    try {
        console.log('[getAllParkingSlots] Fetching all parking slots');

        const [slots] = await pool.query(`
            SELECT id, slot_number, status, last_updated 
            FROM parking_slots 
            ORDER BY slot_number ASC
        `);

        console.log(`[getAllParkingSlots] Found ${slots.length} slots`);

        res.status(200).json({
            success: true,
            count: slots.length,
            data: slots
        });

    } catch (error) {
        console.error('[getAllParkingSlots] Error:', error);
        next(error);
    }
};

// @desc    Get parking slot by ID
// @route   GET /api/parking/:id
// @access  Public
const getParkingSlotById = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`[getParkingSlotById] Fetching slot with ID: ${id}`);

        const [slots] = await pool.query(`
            SELECT id, slot_number, status, last_updated 
            FROM parking_slots 
            WHERE id = ?
        `, [id]);

        if (slots.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parking slot not found'
            });
        }

        res.status(200).json({
            success: true,
            data: slots[0]
        });

    } catch (error) {
        console.error('[getParkingSlotById] Error:', error);
        next(error);
    }
};

// @desc    Reserve a parking slot (auto-release after 10 minutes)
// @route   POST /api/parking/reserve/:id
// @access  Public
const reserveParkingSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`[reserveParkingSlot] Reserving slot ID: ${id}`);

        // Check if slot exists and is available
        const [slots] = await pool.query('SELECT * FROM parking_slots WHERE id = ?', [id]);

        if (slots.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parking slot not found'
            });
        }

        if (slots[0].status !== 'available') {
            return res.status(400).json({
                success: false,
                message: `Slot is currently ${slots[0].status}. Only available slots can be reserved.`
            });
        }

        // Update slot status to reserved
        await pool.query('UPDATE parking_slots SET status = "reserved" WHERE id = ?', [id]);

        // Log the status change
        await pool.query('INSERT INTO parking_logs (slot_id, status) VALUES (?, "reserved")', [id]);

        // Clear any existing timer for this slot
        if (reservationTimers.has(parseInt(id))) {
            clearTimeout(reservationTimers.get(parseInt(id)));
        }

        // Set up auto-release timer (10 minutes = 600000ms)
        const timer = setTimeout(async () => {
            try {
                // Check current status before auto-releasing
                const [currentSlot] = await pool.query('SELECT status FROM parking_slots WHERE id = ?', [id]);
                
                if (currentSlot.length > 0 && currentSlot[0].status === 'reserved') {
                    await pool.query('UPDATE parking_slots SET status = "available" WHERE id = ?', [id]);
                    await pool.query('INSERT INTO parking_logs (slot_id, status) VALUES (?, "available")', [id]);
                    console.log(`[reserveParkingSlot] Auto-released slot ID: ${id} after 10 minutes`);
                }
                
                reservationTimers.delete(parseInt(id));
            } catch (autoReleaseError) {
                console.error('[reserveParkingSlot] Auto-release error:', autoReleaseError);
            }
        }, 600000); // 10 minutes

        reservationTimers.set(parseInt(id), timer);

        // Get updated slot info
        const [updatedSlot] = await pool.query('SELECT * FROM parking_slots WHERE id = ?', [id]);

        console.log(`[reserveParkingSlot] Slot ${id} reserved. Will auto-release in 10 minutes.`);

        res.status(200).json({
            success: true,
            message: 'Slot reserved successfully. Will auto-release in 10 minutes.',
            data: updatedSlot[0],
            expiresIn: 600 // seconds
        });

    } catch (error) {
        console.error('[reserveParkingSlot] Error:', error);
        next(error);
    }
};

// @desc    Update parking slot status (for IoT integration)
// @route   POST /api/parking/update/:id
// @access  Public (should be secured in production)
const updateParkingSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log(`[updateParkingSlot] Updating slot ID: ${id} to status: ${status}`);

        // Validate status
        const validStatuses = ['available', 'occupied', 'reserved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Check if slot exists
        const [slots] = await pool.query('SELECT * FROM parking_slots WHERE id = ?', [id]);

        if (slots.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Parking slot not found'
            });
        }

        // If status is changing, clear any existing reservation timer
        if (status !== 'reserved' && reservationTimers.has(parseInt(id))) {
            clearTimeout(reservationTimers.get(parseInt(id)));
            reservationTimers.delete(parseInt(id));
        }

        // Update slot status
        await pool.query('UPDATE parking_slots SET status = ? WHERE id = ?', [status, id]);

        // Log the status change
        await pool.query('INSERT INTO parking_logs (slot_id, status) VALUES (?, ?)', [id, status]);

        // Get updated slot info
        const [updatedSlot] = await pool.query('SELECT * FROM parking_slots WHERE id = ?', [id]);

        console.log(`[updateParkingSlot] Slot ${id} updated to ${status}`);

        res.status(200).json({
            success: true,
            message: `Slot status updated to ${status}`,
            data: updatedSlot[0]
        });

    } catch (error) {
        console.error('[updateParkingSlot] Error:', error);
        next(error);
    }
};

// @desc    Get parking analytics
// @route   GET /api/parking/analytics
// @access  Public
const getParkingAnalytics = async (req, res, next) => {
    try {
        console.log('[getParkingAnalytics] Fetching parking analytics');

        // Peak hours (GROUP BY HOUR)
        const [peakHours] = await pool.query(`
            SELECT 
                HOUR(changed_at) as hour,
                COUNT(*) as count
            FROM parking_logs
            WHERE status = 'occupied'
            GROUP BY HOUR(changed_at)
            ORDER BY hour ASC
        `);

        // Daily occupancy rate (GROUP BY DATE)
        const [dailyOccupancy] = await pool.query(`
            SELECT 
                DATE(changed_at) as date,
                COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_count,
                COUNT(*) as total_changes
            FROM parking_logs
            WHERE changed_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(changed_at)
            ORDER BY date ASC
        `);

        // Total slot usage
        const [totalUsage] = await pool.query(`
            SELECT 
                COUNT(*) as total_logs,
                COUNT(CASE WHEN status = 'occupied' THEN 1 END) as total_occupied,
                COUNT(CASE WHEN status = 'reserved' THEN 1 END) as total_reserved,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as total_available
            FROM parking_logs
        `);

        // Most used slots
        const [mostUsedSlots] = await pool.query(`
            SELECT 
                ps.slot_number,
                COUNT(pl.log_id) as usage_count
            FROM parking_slots ps
            LEFT JOIN parking_logs pl ON ps.id = pl.slot_id
            GROUP BY ps.id, ps.slot_number
            ORDER BY usage_count DESC
            LIMIT 5
        `);

        // Average occupancy duration (in hours)
        const [avgDuration] = await pool.query(`
            SELECT 
                AVG(TIMESTAMPDIFF(MINUTE, 
                    (SELECT pl2.changed_at FROM parking_logs pl2 
                     WHERE pl2.slot_id = pl.slot_id AND pl2.status = 'occupied' 
                     AND pl2.changed_at < pl.changed_at 
                     ORDER BY pl2.changed_at DESC LIMIT 1),
                    pl.changed_at
                )) as avg_minutes
            FROM parking_logs pl
            WHERE pl.status = 'available'
        `);

        const analytics = {
            peakHours: peakHours.map(h => ({
                hour: h.hour,
                label: `${h.hour}:00`,
                count: h.count
            })),
            dailyOccupancy: dailyOccupancy.map(d => ({
                date: d.date,
                occupiedCount: d.occupied_count,
                totalChanges: d.total_changes,
                occupancyRate: d.total_changes > 0 ? Math.round((d.occupied_count / d.total_changes) * 100) : 0
            })),
            totalUsage: totalUsage[0],
            mostUsedSlots,
            avgOccupancyMinutes: avgDuration[0]?.avg_minutes || 0
        };

        console.log('[getParkingAnalytics] Analytics generated');

        res.status(200).json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('[getParkingAnalytics] Error:', error);
        next(error);
    }
};

// @desc    Get available parking count
// @route   GET /api/parking/available-count
// @access  Public
const getAvailableCount = async (req, res, next) => {
    try {
        const [result] = await pool.query('SELECT COUNT(*) as count FROM parking_slots WHERE status = "available"');
        
        res.status(200).json({
            success: true,
            availableSlots: result[0].count
        });

    } catch (error) {
        console.error('[getAvailableCount] Error:', error);
        next(error);
    }
};

// @desc    Get parking slots by location ID
// @route   GET /api/parking/slots/:locationId
// @access  Public
const getSlotsByLocation = async (req, res, next) => {
    try {
        const { locationId } = req.params;
        console.log(`[getSlotsByLocation] Fetching slots for location ID: ${locationId}`);

        // Query parking_slots_v2 table which has location_id
        const [slots] = await pool.query(`
            SELECT slot_number, status 
            FROM parking_slots_v2 
            WHERE location_id = ?
            ORDER BY slot_number ASC
        `, [locationId]);

        console.log(`[getSlotsByLocation] Found ${slots.length} slots for location ${locationId}`);

        res.status(200).json({
            success: true,
            slots: slots
        });

    } catch (error) {
        console.error('[getSlotsByLocation] Parking API error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getParkingSummary,
    getAllParkingSlots,
    getParkingSlotById,
    reserveParkingSlot,
    updateParkingSlot,
    getParkingAnalytics,
    getAvailableCount,
    getSlotsByLocation
};
