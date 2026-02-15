const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get hotels for a specific destination
router.get("/:destinationId", async (req, res) => {
  try {
    const { destinationId } = req.params;

    if (!destinationId) {
      return res.status(400).json({ message: "Destination ID is required" });
    }

    const [hotels] = await pool.query(
      "SELECT * FROM hotels WHERE destination_id = ? ORDER BY rating DESC",
      [destinationId]
    );

    // If no hotels found, return empty array instead of error
    if (hotels.length === 0) {
      return res.json([]);
    }

    res.json(hotels);
  } catch (error) {
    console.error("DB Query Error:", error);
    res.status(500).json({ message: "Failed to fetch hotels" });
  }
});

module.exports = router;
