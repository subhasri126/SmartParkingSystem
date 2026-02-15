const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    let { search, category, minPrice, maxPrice, continent } = req.query;

    const defaultImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80";

    let query = `
      SELECT
        MIN(id) AS id,
        name,
        country,
        continent,
        category,
        description,
        price_starting,
        rating,
        image_url
      FROM destinations
      WHERE 1=1
    `;
    let values = [];

    if (search) {
      query += " AND name LIKE ?";
      values.push(`%${search}%`);
    }

    if (category) {
      query += " AND category = ?";
      values.push(category);
    }

    if (continent) {
      query += " AND continent = ?";
      values.push(continent);
    }

    if (minPrice) {
      query += " AND price_starting >= ?";
      values.push(minPrice);
    }

    if (maxPrice) {
      query += " AND price_starting <= ?";
      values.push(maxPrice);
    }

    query += `
      GROUP BY
        name,
        country,
        continent,
        category,
        description,
        price_starting,
        rating,
        image_url
    `;

    const [rows] = await pool.query(query, values);
    
    // Apply fallback logic for missing/empty image_url
    rows.forEach((place) => {
      if (!place.image_url || place.image_url.trim() === "") {
        place.image_url = defaultImageUrl;
      }
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
    
    res.json(destination);
  } catch (error) {
    console.error("DB Query Error:", error);
    res.status(500).json({ message: "Failed to fetch destination" });
  }
});

module.exports = router;
