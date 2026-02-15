// =====================================================
// DESTINATION MODEL
// Handle all database operations for destinations
// =====================================================

const { pool } = require('../config/database');

class Destination {
    // Get all destinations with filtering, pagination, and sorting
    static async getAll(options = {}) {
        const {
            page = 1,
            limit = 9,
            category = null,
            country = null,
            continent = null,
            sort = 'rating'
        } = options;

        // Calculate offset
        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereConditions = [];
        let queryParams = [];

        if (category) {
            whereConditions.push('category = ?');
            queryParams.push(category);
        }

        if (country) {
            whereConditions.push('country LIKE ?');
            queryParams.push(`%${country}%`);
        }

        if (continent) {
            whereConditions.push('continent = ?');
            queryParams.push(continent);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // Build ORDER BY clause
        let orderBy = 'rating DESC';
        switch (sort) {
            case 'price_low':
                orderBy = 'price_starting ASC';
                break;
            case 'price_high':
                orderBy = 'price_starting DESC';
                break;
            case 'rating':
                orderBy = 'rating DESC';
                break;
            case 'name':
                orderBy = 'name ASC';
                break;
            default:
                orderBy = 'rating DESC';
        }

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM destinations 
            ${whereClause}
        `;
        const [countResult] = await pool.execute(countQuery, queryParams);
        const total = countResult[0].total;

        // Get destinations - Clone params for the select query
        const selectParams = [...queryParams];
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        selectParams.push(limitNum, offsetNum);
        
        const query = `
            SELECT * FROM destinations 
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(query, selectParams);

        return {
            destinations: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // Get featured destinations
    static async getFeatured() {
        const query = `
            SELECT * FROM destinations 
            WHERE is_featured = TRUE 
            ORDER BY rating DESC
        `;
        
        const [rows] = await pool.execute(query);
        return rows;
    }

    // Get destination by ID
    static async getById(id) {
        const query = 'SELECT * FROM destinations WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        return rows[0];
    }

    // Get all unique countries
    static async getCountries() {
        const query = 'SELECT DISTINCT country FROM destinations ORDER BY country ASC';
        const [rows] = await pool.execute(query);
        return rows.map(row => row.country);
    }

    // Get all unique continents
    static async getContinents() {
        const query = 'SELECT DISTINCT continent FROM destinations ORDER BY continent ASC';
        const [rows] = await pool.execute(query);
        return rows.map(row => row.continent);
    }

    // Get all categories
    static getCategories() {
        return ['Beach', 'Mountain', 'City', 'Cultural', 'Nature', 'Island', 'Desert'];
    }

    // Search destinations by name or description
    static async search(searchTerm, limit = 10) {
        const query = `
            SELECT * FROM destinations 
            WHERE name LIKE ? OR description LIKE ? OR country LIKE ?
            ORDER BY rating DESC
            LIMIT ?
        `;
        
        const searchPattern = `%${searchTerm}%`;
        const [rows] = await pool.execute(query, [
            searchPattern, 
            searchPattern, 
            searchPattern, 
            parseInt(limit)
        ]);
        
        return rows;
    }
}

module.exports = Destination;
