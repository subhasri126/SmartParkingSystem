const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    let { search, category, minPrice, maxPrice, state } = req.query;

    const defaultImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80";

    let query = `
      SELECT
        MIN(id) AS id,
        name,
        state,
        category,
        description,
        average_budget,
        rating,
        image_url,
        is_featured
      FROM destinations
      WHERE 1=1
    `;
    let values = [];

    if (search) {
      query += " AND (name LIKE ? OR state LIKE ?)";
      values.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += " AND category = ?";
      values.push(category);
    }

    if (state) {
      query += " AND state = ?";
      values.push(state);
    }

    if (minPrice) {
      query += " AND average_budget >= ?";
      values.push(minPrice);
    }

    if (maxPrice) {
      query += " AND average_budget <= ?";
      values.push(maxPrice);
    }

    query += `
      GROUP BY
        name,
        state,
        category,
        description,
        average_budget,
        rating,
        image_url,
        is_featured
      ORDER BY rating DESC
    `;

    const [rows] = await pool.query(query, values);
    
    // Apply fallback logic for missing/empty image_url
    rows.forEach((place) => {
      if (!place.image_url || place.image_url.trim() === "") {
        place.image_url = defaultImageUrl;
      }
      // Map field names for frontend compatibility
      place.country = 'India';
      place.continent = 'Asia';
      place.price_starting = place.average_budget;
    });
    
    res.json(rows);
  } catch (error) {
    console.error("DB Query Error:", error);
    res.status(500).json({ message: "Filter failed" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const defaultImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80";
    
    const [rows] = await pool.query(
      "SELECT * FROM destinations WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Destination not found" });
    }

    const destination = rows[0];
    
    // Apply fallback logic for missing/null image_url
    if (!destination.image_url || destination.image_url.trim() === "") {
      destination.image_url = defaultImageUrl;
    }
    
    // Map field names for frontend compatibility
    destination.country = 'India';
    destination.continent = 'Asia';
    destination.price_starting = destination.average_budget;
    
    res.json(destination);
  } catch (error) {
    console.error("DB Query Error:", error);
    res.status(500).json({ message: "Failed to fetch destination" });
  }
});

// Get all unique states
router.get("/filters/states", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT state FROM destinations ORDER BY state ASC"
    );
    res.json(rows.map(row => row.state));
  } catch (error) {
    console.error("DB Query Error:", error);
    res.status(500).json({ message: "Failed to fetch states" });
  }
});

// Get all categories
router.get("/filters/categories", async (req, res) => {
  try {
    const categories = ['Beach', 'Hill Station', 'Heritage', 'Nature', 'City', 'Spiritual'];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

module.exports = router;
