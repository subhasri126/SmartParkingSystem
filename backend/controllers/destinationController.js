// =====================================================
// DESTINATION CONTROLLER
// Handle all destination-related logic
// =====================================================

const Destination = require('../models/Destination');

// @desc    Get all destinations with filtering, pagination, and sorting
// @route   GET /api/destinations
// @access  Public
const getDestinations = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 9,
            category,
            country,
            continent,
            sort = 'rating'
        } = req.query;

        console.log('[getDestinations] Query params:', req.query);

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

        // Get destinations
        const result = await Destination.getAll({
            page: pageNum,
            limit: limitNum,
            category,
            country,
            continent,
            sort
        });

        console.log(`[getDestinations] Returning ${result.destinations.length} destinations`);

        // Return strictly JSON array as requested by user
        res.json(result.destinations);

    } catch (error) {
        console.error('[getDestinations] Error:', error);
        next(error);
    }
};

// @desc    Get featured destinations
// @route   GET /api/destinations/featured
// @access  Public
const getFeaturedDestinations = async (req, res, next) => {
    try {
        console.log('[getFeaturedDestinations] Fetching featured destinations');

        const destinations = await Destination.getFeatured();

        console.log(`[getFeaturedDestinations] Returning ${destinations.length} featured destinations`);

        res.status(200).json({
            success: true,
            count: destinations.length,
            destinations
        });

    } catch (error) {
        console.error('[getFeaturedDestinations] Error:', error);
        next(error);
    }
};

// @desc    Get destination by ID
// @route   GET /api/destinations/:id
// @access  Public
const getDestinationById = async (req, res, next) => {
    try {
        const { id } = req.params;

        console.log(`[getDestinationById] Fetching destination with ID: ${id}`);

        const destination = await Destination.getById(id);

        if (!destination) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found'
            });
        }

        console.log(`[getDestinationById] Found destination: ${destination.name}`);

        res.status(200).json({
            success: true,
            destination
        });

    } catch (error) {
        console.error('[getDestinationById] Error:', error);
        next(error);
    }
};

// @desc    Search destinations
// @route   GET /api/destinations/search
// @access  Public
const searchDestinations = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        console.log(`[searchDestinations] Searching for: ${q}`);

        const destinations = await Destination.search(q);

        console.log(`[searchDestinations] Found ${destinations.length} destinations`);

        res.status(200).json({
            success: true,
            count: destinations.length,
            destinations
        });

    } catch (error) {
        console.error('[searchDestinations] Error:', error);
        next(error);
    }
};

// @desc    Get all countries
// @route   GET /api/destinations/filters/countries
// @access  Public
const getCountries = async (req, res, next) => {
    try {
        console.log('[getCountries] Fetching all countries');

        const countries = await Destination.getCountries();

        res.status(200).json({
            success: true,
            count: countries.length,
            countries
        });

    } catch (error) {
        console.error('[getCountries] Error:', error);
        next(error);
    }
};

// @desc    Get all continents
// @route   GET /api/destinations/filters/continents
// @access  Public
const getContinents = async (req, res, next) => {
    try {
        console.log('[getContinents] Fetching all continents');

        const continents = await Destination.getContinents();

        res.status(200).json({
            success: true,
            count: continents.length,
            continents
        });

    } catch (error) {
        console.error('[getContinents] Error:', error);
        next(error);
    }
};

// @desc    Get all categories
// @route   GET /api/destinations/filters/categories
// @access  Public
const getCategories = async (req, res, next) => {
    try {
        console.log('[getCategories] Fetching all categories');

        const categories = Destination.getCategories();

        res.status(200).json({
            success: true,
            count: categories.length,
            categories
        });

    } catch (error) {
        console.error('[getCategories] Error:', error);
        next(error);
    }
};

module.exports = {
    getDestinations,
    getFeaturedDestinations,
    getDestinationById,
    searchDestinations,
    getCountries,
    getContinents,
    getCategories
};
