const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get tourist spots for a specific destination
router.get("/:destinationId", async (req, res) => {
  try {
    const { destinationId } = req.params;

    if (!destinationId) {
      return res.status(400).json({ message: "Destination ID is required" });
    }

    const [spots] = await pool.query(
      "SELECT * FROM tourist_spots WHERE destination_id = ? ORDER BY id ASC",
      [destinationId]
    );

    // If no spots found, return empty array
    if (spots.length === 0) {
      return res.json([]);
    }

    res.json(spots);
  } catch (error) {
    console.error("DB Query Error:", error);
    res.status(500).json({ message: "Failed to fetch tourist spots" });
  }
});

module.exports = router;
