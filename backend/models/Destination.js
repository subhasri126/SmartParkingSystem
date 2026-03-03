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
            state = null,
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

        if (state) {
            whereConditions.push('state = ?');
            queryParams.push(state);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // Build ORDER BY clause
        let orderBy = 'rating DESC';
        switch (sort) {
            case 'price_low':
                orderBy = 'average_budget ASC';
                break;
            case 'price_high':
                orderBy = 'average_budget DESC';
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
            SELECT *, average_budget as price_starting FROM destinations 
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `;
        
        const [rows] = await pool.query(query, selectParams);
        
        // Add backward compatibility fields
        rows.forEach(row => {
            row.country = 'India';
            row.continent = 'Asia';
        });

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
            SELECT *, average_budget as price_starting FROM destinations 
            WHERE is_featured = TRUE 
            ORDER BY rating DESC
        `;
        
        const [rows] = await pool.execute(query);
        
        // Add backward compatibility fields
        rows.forEach(row => {
            row.country = 'India';
            row.continent = 'Asia';
        });
        
        return rows;
    }

    // Get destination by ID
    static async getById(id) {
        const query = 'SELECT *, average_budget as price_starting FROM destinations WHERE id = ?';
        const [rows] = await pool.execute(query, [id]);
        if (rows[0]) {
            rows[0].country = 'India';
            rows[0].continent = 'Asia';
        }
        return rows[0];
    }

    // Get all unique states
    static async getStates() {
        const query = 'SELECT DISTINCT state FROM destinations ORDER BY state ASC';
        const [rows] = await pool.execute(query);
        return rows.map(row => row.state);
    }

    // Get all unique countries (for backward compatibility)
    static async getCountries() {
        return ['India'];
    }

    // Get all unique continents (for backward compatibility)
    static async getContinents() {
        return ['Asia'];
    }

    // Get all categories
    static getCategories() {
        return ['Beach', 'Hill Station', 'Heritage', 'Nature', 'City', 'Spiritual'];
    }

    // Search destinations by name or description
    static async search(searchTerm, limit = 10) {
        const query = `
            SELECT *, average_budget as price_starting FROM destinations 
            WHERE name LIKE ? OR description LIKE ? OR state LIKE ?
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
        
        // Add backward compatibility fields
        rows.forEach(row => {
            row.country = 'India';
            row.continent = 'Asia';
        });
        
        return rows;
    }
}

module.exports = Destination;
