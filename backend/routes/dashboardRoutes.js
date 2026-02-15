const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

// JWT verification middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token." });
    }
};

// ==================== SEARCH HISTORY ====================

// Save search history
router.post("/search-history", verifyToken, async (req, res) => {
    try {
        const { destination_id } = req.body;
        const user_id = req.userId;

        if (!destination_id) {
            return res.status(400).json({ message: "Destination ID is required" });
        }

        // Check if this destination was already searched by user today
        const [existing] = await pool.query(
            `SELECT id FROM user_search_history 
             WHERE user_id = ? AND destination_id = ? 
             AND DATE(search_date) = CURDATE()`,
            [user_id, destination_id]
        );

        if (existing.length > 0) {
            // Already saved today, just return success
            return res.json({ message: "Search history updated", id: existing[0].id });
        }

        // Insert new search history
        const [result] = await pool.query(
            "INSERT INTO user_search_history (user_id, destination_id) VALUES (?, ?)",
            [user_id, destination_id]
        );

        res.json({
            message: "Search history saved successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error("Error saving search history:", error);
        res.status(500).json({ message: "Error saving search history" });
    }
});

// Get user's search history
router.get("/search-history/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Verify the user is requesting their own history
        if (parseInt(userId) !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const [history] = await pool.query(
            `SELECT 
                h.id,
                h.search_date,
                d.id as destination_id,
                d.name,
                d.country,
                d.region,
                d.category,
                d.image_url
             FROM user_search_history h
             JOIN destinations d ON h.destination_id = d.id
             WHERE h.user_id = ?
             ORDER BY h.search_date DESC
             LIMIT 20`,
            [userId]
        );

        res.json(history);
    } catch (error) {
        console.error("Error fetching search history:", error);
        res.status(500).json({ message: "Error fetching search history" });
    }
});

// ==================== BOOKINGS ====================

// Create a new booking
router.post("/bookings", verifyToken, async (req, res) => {
    try {
        const { hotel_id, check_in, check_out, num_guests, amount } = req.body;
        const user_id = req.userId;

        if (!hotel_id || !check_in || !check_out || !amount) {
            return res.status(400).json({ 
                message: "Hotel ID, check-in, check-out dates, and amount are required" 
            });
        }

        // Validate dates
        const checkInDate = new Date(check_in);
        const checkOutDate = new Date(check_out);
        
        if (checkInDate >= checkOutDate) {
            return res.status(400).json({ 
                message: "Check-out date must be after check-in date" 
            });
        }

        if (checkInDate < new Date()) {
            return res.status(400).json({ 
                message: "Check-in date cannot be in the past" 
            });
        }

        // Insert booking
        const [result] = await pool.query(
            `INSERT INTO hotel_bookings 
             (user_id, hotel_id, check_in, check_out, num_guests, amount) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, hotel_id, check_in, check_out, num_guests || 2, amount]
        );

        res.json({
            message: "Booking confirmed successfully",
            booking_id: result.insertId
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Error creating booking" });
    }
});

// Get user's bookings
router.get("/bookings/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Verify the user is requesting their own bookings
        if (parseInt(userId) !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        const [bookings] = await pool.query(
            `SELECT 
                b.id,
                b.check_in,
                b.check_out,
                b.num_guests,
                b.amount,
                b.booking_date,
                b.status,
                h.name as hotel_name,
                h.image_url as hotel_image,
                h.rating as hotel_rating,
                d.name as destination_name
             FROM hotel_bookings b
             JOIN hotels h ON b.hotel_id = h.id
             JOIN destinations d ON h.destination_id = d.id
             WHERE b.user_id = ?
             ORDER BY b.booking_date DESC`,
            [userId]
        );

        res.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Error fetching bookings" });
    }
});

// ==================== REVIEWS ====================

// Submit a review
router.post("/reviews", verifyToken, async (req, res) => {
    try {
        const { destination_id, rating, review_text } = req.body;
        const user_id = req.userId;

        if (!destination_id || !rating) {
            return res.status(400).json({ 
                message: "Destination ID and rating are required" 
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                message: "Rating must be between 1 and 5" 
            });
        }

        // Check if user already reviewed this destination
        const [existing] = await pool.query(
            "SELECT id FROM user_reviews WHERE user_id = ? AND destination_id = ?",
            [user_id, destination_id]
        );

        if (existing.length > 0) {
            // Update existing review
            await pool.query(
                `UPDATE user_reviews 
                 SET rating = ?, review_text = ?, created_at = NOW() 
                 WHERE id = ?`,
                [rating, review_text, existing[0].id]
            );

            return res.json({
                message: "Review updated successfully",
                review_id: existing[0].id
            });
        }

        // Insert new review
        const [result] = await pool.query(
            `INSERT INTO user_reviews (user_id, destination_id, rating, review_text) 
             VALUES (?, ?, ?, ?)`,
            [user_id, destination_id, rating, review_text]
        );

        res.json({
            message: "Review submitted successfully",
            review_id: result.insertId
        });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ message: "Error submitting review" });
    }
});

// Get reviews for a destination
router.get("/reviews/:destinationId", async (req, res) => {
    try {
        const destinationId = req.params.destinationId;

        const [reviews] = await pool.query(
            `SELECT 
                r.id,
                r.rating,
                r.review_text,
                r.created_at,
                u.name as user_name,
                u.email as user_email
             FROM user_reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.destination_id = ?
             ORDER BY r.created_at DESC`,
            [destinationId]
        );

        res.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Error fetching reviews" });
    }
});

// Get average ratings for tourist spots (experience-based learning)
router.get("/spot-ratings/:destinationId", async (req, res) => {
    try {
        const destinationId = req.params.destinationId;

        // Return aggregated user ratings for spots
        // For now, this returns average rating from user_reviews table
        // In a more advanced system, you could have spot-specific reviews
        const [ratings] = await pool.query(
            `SELECT 
                ts.id as spot_id,
                ts.name,
                AVG(r.rating) as avg_rating,
                COUNT(r.id) as review_count
             FROM tourist_spots ts
             LEFT JOIN user_reviews r ON r.destination_id = ts.destination_id
             WHERE ts.destination_id = ?
             GROUP BY ts.id
             ORDER BY avg_rating DESC`,
            [destinationId]
        );

        res.json(ratings);
    } catch (error) {
        console.error("Error fetching spot ratings:", error);
        res.status(500).json({ message: "Error fetching spot ratings" });
    }
});

// ==================== DASHBOARD STATS ====================

// Get user dashboard statistics
router.get("/stats/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Verify the user is requesting their own stats
        if (parseInt(userId) !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Get total bookings
        const [bookingStats] = await pool.query(
            "SELECT COUNT(*) as total_bookings, SUM(amount) as total_spent FROM hotel_bookings WHERE user_id = ?",
            [userId]
        );

        // Get total reviews
        const [reviewStats] = await pool.query(
            "SELECT COUNT(*) as total_reviews FROM user_reviews WHERE user_id = ?",
            [userId]
        );

        // Get total destinations searched
        const [historyStats] = await pool.query(
            "SELECT COUNT(DISTINCT destination_id) as destinations_explored FROM user_search_history WHERE user_id = ?",
            [userId]
        );

        res.json({
            total_bookings: bookingStats[0].total_bookings || 0,
            total_spent: bookingStats[0].total_spent || 0,
            total_reviews: reviewStats[0].total_reviews || 0,
            destinations_explored: historyStats[0].destinations_explored || 0
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Error fetching dashboard statistics" });
    }
});

module.exports = router;
