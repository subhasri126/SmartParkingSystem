const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

console.log("✅ Dashboard routes loaded");

// Request logging for dashboard routes
router.use((req, res, next) => {
    console.log(`[Dashboard] ${req.method} ${req.originalUrl}`);
    next();
});

// JWT verification middleware
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.error("Auth error: Missing token");
        return res.status(401).json({ message: "Unauthorized access" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        req.userId = decoded.id;
        console.log("Authenticated user:", req.userId);
        next();
    } catch (error) {
        console.error("Auth error: Invalid token", error.message);
        res.status(403).json({ message: "Invalid or expired token" });
    }
};

// ==================== SEARCH HISTORY ====================

// Save search history
router.post("/search-history", verifyToken, async (req, res) => {
    try {
        const { destination_id } = req.body;
        const user_id = req.userId;

        console.log("Search history payload:", { user_id, destination_id });

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

        res.status(200).json({
            message: "Search history saved successfully",
            id: result.insertId
        });
    } catch (error) {
        console.error("Error saving search history:", error);
        res.status(500).json({ message: "Database query failed" });
    }
});

// Get user's search history
router.get("/search-history/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        console.log("Search history request:", { userId, authUserId: req.userId });

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
                d.state as country,
                d.category,
                d.image_url
             FROM user_search_history h
             JOIN destinations d ON h.destination_id = d.id
             WHERE h.user_id = ?
             ORDER BY h.search_date DESC
             LIMIT 20`,
            [userId]
        );

        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching search history:", error);
        res.status(500).json({ message: "Database query failed" });
    }
});

// ==================== BOOKINGS ====================

// Create a new booking
router.post("/bookings", verifyToken, async (req, res) => {
    try {
        const { hotel_id, check_in, check_out, num_guests, amount } = req.body;
        const user_id = req.userId;

        console.log("Booking payload:", { user_id, hotel_id, check_in, check_out, num_guests, amount });

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

        // Create hotel_bookings table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS hotel_bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                hotel_id INT NOT NULL,
                check_in DATE NOT NULL,
                check_out DATE NOT NULL,
                num_guests INT DEFAULT 2,
                amount DECIMAL(10, 2) NOT NULL,
                booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'confirmed'
            )
        `);

        // Insert booking
        const [result] = await pool.query(
            `INSERT INTO hotel_bookings 
             (user_id, hotel_id, check_in, check_out, num_guests, amount) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, hotel_id, check_in, check_out, num_guests || 2, amount]
        );

        res.status(200).json({
            message: "Booking confirmed successfully",
            booking_id: result.insertId
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Database query failed" });
    }
});

// Quick book a hotel from the app explore flow
router.post("/book-hotel", verifyToken, async (req, res) => {
    try {
        const { user_id, hotel_id, destination_id, check_in_date, check_out_date, nights, total_price } = req.body;
        const authUserId = req.userId;

        // Debug logging
        console.log("Booking request:", req.body);
        console.log("Received dates - check_in_date:", check_in_date, "check_out_date:", check_out_date);

        // Validate user access
        if (user_id && parseInt(user_id, 10) !== authUserId) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        // Validate required fields
        if (!hotel_id || !destination_id) {
            return res.status(400).json({
                success: false,
                message: "Hotel ID and destination ID are required"
            });
        }

        // Validate dates are provided
        if (!check_in_date || !check_out_date) {
            return res.status(400).json({ success: false, message: "Dates are required" });
        }

        // Parse and validate dates
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);

        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid date format" });
        }

        if (checkOut <= checkIn) {
            return res.status(400).json({ success: false, message: "Check-out must be after check-in" });
        }

        // Fetch hotel details
        const [hotelRows] = await pool.query(
            "SELECT id, destination_id, price_per_night FROM hotels WHERE id = ?",
            [hotel_id]
        );

        if (!hotelRows.length) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        const hotel = hotelRows[0];
        if (destination_id && parseInt(destination_id, 10) !== hotel.destination_id) {
            return res.status(400).json({ success: false, message: "Hotel does not match destination" });
        }

        // Calculate nights and price
        let calculatedNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        if (nights) {
            calculatedNights = Math.max(nights, calculatedNights);
        }

        let price = Number(total_price) || 0;
        if (!price && hotel.price_per_night) {
            price = Number(hotel.price_per_night) * calculatedNights;
        }

        const formatDate = (value) => value.toISOString().split("T")[0];

        // Log formatted dates before insert
        console.log("Formatted dates for DB - check_in:", formatDate(checkIn), "check_out:", formatDate(checkOut));

        // Insert booking into database using 'price' column
        const [result] = await pool.query(
            `INSERT INTO bookings 
             (user_id, hotel_id, destination_id, check_in_date, check_out_date, nights, price, booking_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'confirmed')`,
            [authUserId, hotel.id, hotel.destination_id, formatDate(checkIn), formatDate(checkOut), calculatedNights, price]
        );

        console.log("Booking created successfully:", result.insertId);

        // Also insert into hotel_bookings for backward compatibility
        try {
            await pool.query(
                `INSERT INTO hotel_bookings 
                 (user_id, hotel_id, check_in, check_out, num_guests, amount) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [authUserId, hotel.id, formatDate(checkIn), formatDate(checkOut), 2, price]
            );
        } catch (hotelBookingError) {
            console.warn("hotel_bookings insert failed (non-critical):", hotelBookingError.message);
        }

        res.status(200).json({
            success: true,
            message: "Hotel booked successfully",
            bookingId: result.insertId,
            booking: {
                id: result.insertId,
                hotelId: hotel.id,
                checkInDate: formatDate(checkIn),
                checkOutDate: formatDate(checkOut),
                nights: calculatedNights,
                totalPrice: price
            }
        });
    } catch (error) {
        console.error("Error booking hotel:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to book hotel"
        });
    }
});

// Suggest best-fit hotel based on budget and time
router.get("/hotel-suggestion/:destinationId", async (req, res) => {
    try {
        const { destinationId } = req.params;
        const budget = req.query.budget ? parseFloat(req.query.budget) : null;
        const timeParam = req.query.time || "";
        const hour = parseInt(timeParam.split(":")[0], 10);

        if (!destinationId) {
            return res.status(400).json({ success: false, message: "Destination ID is required" });
        }

        const params = [destinationId];
        let query = "SELECT id, name, rating, price_per_night, image_url FROM hotels WHERE destination_id = ?";

        if (!Number.isNaN(budget) && budget !== null) {
            query += " AND price_per_night <= ?";
            params.push(budget);
        }

        const [hotels] = await pool.query(query, params);

        if (!hotels.length) {
            return res.status(200).json({
                success: false,
                message: "No hotel suggestion available for this destination"
            });
        }

        const prioritizeNearest = Number.isFinite(hour) && hour >= 18;
        const bestHotel = hotels.reduce((best, current) => {
            if (!best) return current;
            if (prioritizeNearest) {
                return current.price_per_night < best.price_per_night ? current : best;
            }
            return current.rating > best.rating ? current : best;
        }, null);

        res.status(200).json({
            success: true,
            hotel: {
                id: bestHotel.id,
                name: bestHotel.name,
                rating: bestHotel.rating,
                price: bestHotel.price_per_night,
                image_url: bestHotel.image_url
            }
        });
    } catch (error) {
        console.error("Error suggesting hotel:", error);
        res.status(500).json({ success: false, message: "Failed to suggest hotel" });
    }
});

// Get user's bookings
router.get("/bookings/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        console.log("Bookings request:", { userId, authUserId: req.userId });

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

        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Database query failed" });
    }
});

// Get user's trips (from both bookings and hotel_bookings)
router.get("/my-trips/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        console.log("My trips request:", { userId, authUserId: req.userId });

        // Verify the user is requesting their own trips
        if (parseInt(userId) !== req.userId) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        // Query bookings table joined with parking_locations based on destination name
        // We look for parking locations where the city matches the destination name and aggregate availability
        const [tripRows] = await pool.query(
            `SELECT 
                b.id,
                b.hotel_id,
                b.destination_id,
                b.check_in_date,
                b.check_out_date,
                b.nights,
                b.price as total_price,
                b.booking_date,
                b.status,
                h.name as hotel_name,
                h.image_url as hotel_image,
                h.rating as hotel_rating,
                h.price_per_night,
                d.name as destination_name,
                d.country as destination_country,
                d.image_url as destination_image,
                pl.available as parking_available,
                pl.total as parking_total
             FROM bookings b
             JOIN hotels h ON b.hotel_id = h.id
             JOIN destinations d ON b.destination_id = d.id
             LEFT JOIN (
                 SELECT city, SUM(available_slots) as available, SUM(total_slots) as total
                 FROM parking_locations
                 GROUP BY city
             ) pl ON pl.city = d.name
             WHERE b.user_id = ?
             ORDER BY b.check_in_date DESC`,
            [userId]
        );

        // Format response
        const trips = tripRows.map(trip => ({
            id: trip.id,
            hotelId: trip.hotel_id,
            destinationId: trip.destination_id,
            hotelName: trip.hotel_name,
            hotelImage: trip.hotel_image,
            hotelRating: Number(trip.hotel_rating || 0).toFixed(1),
            destinationName: trip.destination_name,
            destinationCountry: trip.destination_country,
            destinationImage: trip.destination_image,
            checkInDate: trip.check_in_date,
            checkOutDate: trip.check_out_date,
            nights: trip.nights,
            totalPrice: Number(trip.total_price),
            pricePerNight: Number(trip.price_per_night),
            bookingDate: trip.booking_date,
            status: trip.status,
            parking: trip.parking_total ? {
                available: trip.parking_available,
                total: trip.parking_total
            } : null
        }));

        res.status(200).json({
            success: true,
            trips: trips,
            count: trips.length
        });
    } catch (error) {
        console.error("Error fetching my trips:", error);
        res.status(500).json({ success: false, message: "Failed to fetch trips" });
    }
});

// ==================== REVIEWS ====================

// Submit a review
router.post("/reviews", verifyToken, async (req, res) => {
    try {
        const { destination_id, rating, review_text } = req.body;
        const user_id = req.userId;

        console.log("Review payload:", { user_id, destination_id, rating, review_text });

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

            return res.status(200).json({
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

        res.status(200).json({
            message: "Review submitted successfully",
            review_id: result.insertId
        });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ message: "Database query failed" });
    }
});

// Get reviews for a destination
router.get("/reviews/:destinationId", async (req, res) => {
    try {
        const destinationId = req.params.destinationId;

        console.log("Reviews request:", { destinationId });

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

        res.status(200).json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Database query failed" });
    }
});

// Get average ratings for tourist spots (experience-based learning)
router.get("/spot-ratings/:destinationId", async (req, res) => {
    try {
        const destinationId = req.params.destinationId;

        console.log("Spot ratings request:", { destinationId });

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

        res.status(200).json(ratings);
    } catch (error) {
        console.error("Error fetching spot ratings:", error);
        res.status(500).json({ message: "Database query failed" });
    }
});

// ==================== DASHBOARD STATS ====================

// Get user dashboard statistics
router.get("/stats/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        console.log("Stats request:", { userId, authUserId: req.userId });

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

        res.status(200).json({
            total_bookings: bookingStats[0].total_bookings || 0,
            total_spent: bookingStats[0].total_spent || 0,
            total_reviews: reviewStats[0].total_reviews || 0,
            destinations_explored: historyStats[0].destinations_explored || 0
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Database query failed" });
    }
});

// ==================== STRUCTURED ITINERARY GENERATION ====================
// Generate a professional, day-based itinerary
router.get("/itinerary/:destinationId", async (req, res) => {
    try {
        const { destinationId } = req.params;

        console.log(`[Itinerary] Generating itinerary for destination: ${destinationId}`);

        // Fetch destination details
        const [destination] = await pool.query(
            "SELECT id, name, country, continent, category FROM destinations WHERE id = ?",
            [destinationId]
        );

        if (destination.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Destination not found"
            });
        }

        const destName = destination[0].name;
        const destCountry = destination[0].country;

        // Fetch tourist spots with average destination rating to prioritize
        const [spots] = await pool.query(
            `SELECT 
                ts.id,
                ts.name,
                ts.category,
                ts.description,
                ts.image_url,
                COALESCE(AVG(r.rating), 0) as avg_rating
             FROM tourist_spots ts
             LEFT JOIN user_reviews r ON r.destination_id = ts.destination_id
             WHERE ts.destination_id = ?
             GROUP BY ts.id
             ORDER BY avg_rating DESC, ts.id ASC`,
            [destinationId]
        );

        if (spots.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No tourist spots available for this destination"
            });
        }

        // Generate structured 2-day itinerary
        const itinerary = generateStructuredItinerary(destName, destCountry, spots);

        res.status(200).json({
            success: true,
            destination: destName,
            country: destCountry,
            itinerary: itinerary
        });
    } catch (error) {
        console.error("Error generating itinerary:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate itinerary"
        });
    }
});

// Suggest hotel based on budget and time
router.get("/hotel-suggestion/:destinationId", async (req, res) => {
    try {
        const { destinationId } = req.params;
        const budget = req.query.budget ? parseFloat(req.query.budget) : null;
        const timeParam = req.query.time || "";
        const hour = parseInt(timeParam.split(":")[0], 10);

        if (!destinationId) {
            return res.status(400).json({ success: false, message: "Destination ID is required" });
        }

        const params = [destinationId];
        let query = "SELECT name, rating, price_per_night, image_url FROM hotels WHERE destination_id = ?";

        if (!Number.isNaN(budget) && budget !== null) {
            query += " AND price_per_night <= ?";
            params.push(budget);
        }

        const [hotels] = await pool.query(query, params);

        if (hotels.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No hotel suggestion available for this destination"
            });
        }

        const prioritizeNearest = Number.isFinite(hour) && hour >= 18;
        // Use lowest price as a proximity proxy when distance data is unavailable.
        const bestHotel = hotels.reduce((best, current) => {
            if (!best) return current;
            if (prioritizeNearest) {
                return current.price_per_night < best.price_per_night ? current : best;
            }
            return current.rating > best.rating ? current : best;
        }, null);

        res.status(200).json({
            success: true,
            hotel: {
                name: bestHotel.name,
                rating: bestHotel.rating,
                price: bestHotel.price_per_night,
                image_url: bestHotel.image_url
            }
        });
    } catch (error) {
        console.error("Error suggesting hotel:", error);
        res.status(500).json({ success: false, message: "Failed to suggest hotel" });
    }
});

// Helper function to generate structured itinerary
function generateStructuredItinerary(destName, destCountry, spots) {
    const sortedSpots = [...spots].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    const mainAttraction = sortedSpots[0];
    const remaining = sortedSpots.slice(1);

    // Pick a cultural spot if available for Day 2
    const culturalIndex = remaining.findIndex(spot =>
        (spot.category || '').toLowerCase().includes('culture') ||
        (spot.category || '').toLowerCase().includes('heritage')
    );
    const culturalSpot = culturalIndex >= 0 ? remaining.splice(culturalIndex, 1)[0] : null;

    // Randomize secondary spots while keeping main attraction fixed
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    const secondarySpot = shuffled[0] || null;
    const eveningSpot = shuffled[1] || null;
    const finalSpot = shuffled[2] || null;

    const day1 = {
        day: 1,
        date: "Day 1 - Core Highlights",
        schedule: [
            {
                time: "09:00 AM",
                place: mainAttraction.name,
                category: mainAttraction.category || "Main Attraction",
                description: `Begin with the top-rated attraction in ${destName}.`,
                duration: "2-3 hours"
            },
            {
                time: "12:30 PM",
                place: `Lunch district in ${destName}`,
                category: "Lunch",
                description: "Plan a relaxed lunch break near the central dining area.",
                duration: "1-1.5 hours"
            },
            {
                time: "03:00 PM",
                place: secondarySpot ? secondarySpot.name : `${destName} Scenic Area`,
                category: secondarySpot ? (secondarySpot.category || "Attraction") : "Scenic",
                description: secondarySpot
                    ? `Visit a second attraction with strong reviews in ${destName}.`
                    : "Use this time for a relaxed scenic experience or local walk.",
                duration: "2 hours"
            },
            {
                time: "06:00 PM",
                place: eveningSpot ? eveningSpot.name : "Evening Viewpoint",
                category: eveningSpot ? (eveningSpot.category || "Evening") : "Evening",
                description: eveningSpot
                    ? "Wrap the day with a calm evening experience."
                    : "Choose a sunset-friendly location for photos and downtime.",
                duration: "1.5-2 hours"
            }
        ]
    };

    const day2 = {
        day: 2,
        date: "Day 2 - Culture & Wrap-up",
        schedule: [
            {
                time: "10:00 AM",
                place: culturalSpot ? culturalSpot.name : `${destName} Cultural Site`,
                category: culturalSpot ? (culturalSpot.category || "Cultural") : "Cultural",
                description: "Focus on local culture, heritage, or history in the morning.",
                duration: "2-3 hours"
            },
            {
                time: "01:00 PM",
                place: "Rest & recharge",
                category: "Break",
                description: "Take a break, return to the hotel, and reset for the final stop.",
                duration: "1.5-2 hours"
            },
            {
                time: "04:00 PM",
                place: finalSpot ? finalSpot.name : "Final highlight",
                category: finalSpot ? (finalSpot.category || "Attraction") : "Attraction",
                description: finalSpot
                    ? "Close the trip with a final highlight spot."
                    : "Choose a flexible stop based on your energy and interests.",
                duration: "2 hours"
            }
        ]
    };

    return [day1, day2];
}

module.exports = router;
