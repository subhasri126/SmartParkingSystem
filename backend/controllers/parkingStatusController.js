// =====================================================
// PARKING STATUS API CONTROLLER
// Returns parking slot statistics for dashboard
// =====================================================

const pool = require('../config/db');

/**
 * @desc    Get parking status summary (total, available, occupied, reserved, last updated)
 * @route   GET /api/parking/status
 * @access  Public
 */
const getParkingStatus = async (req, res, next) => {
    try {
        // Use parking_slots_v2 for smart parking
        const [totalResult] = await pool.query('SELECT COUNT(*) as totalSlots FROM parking_slots_v2');
        const [availableResult] = await pool.query('SELECT COUNT(*) as available FROM parking_slots_v2 WHERE status = "available"');
        const [occupiedResult] = await pool.query('SELECT COUNT(*) as occupied FROM parking_slots_v2 WHERE status = "occupied"');
        const [reservedResult] = await pool.query('SELECT COUNT(*) as reserved FROM parking_slots_v2 WHERE status = "reserved"');
        const [lastUpdatedResult] = await pool.query('SELECT MAX(last_updated) as lastUpdated FROM parking_slots_v2');

        res.status(200).json({
            totalSlots: totalResult[0].totalSlots,
            available: availableResult[0].available,
            occupied: occupiedResult[0].occupied,
            reserved: reservedResult[0].reserved,
            lastUpdated: lastUpdatedResult[0].lastUpdated
        });
    } catch (error) {
        console.error('[getParkingStatus] Error:', error);
        res.status(500).json({ error: 'Failed to fetch parking status' });
    }
};

module.exports = { getParkingStatus };