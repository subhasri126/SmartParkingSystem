// =====================================================
// ERROR HANDLER MIDDLEWARE
// Centralized error handling
// =====================================================

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // MySQL duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: 'Email already exists.'
        });
    }

    // MySQL connection error
    if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED') {
        return res.status(500).json({
            success: false,
            message: 'Database connection error. Please try again later.'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired.'
        });
    }

    // Validation errors (express-validator)
    if (err.array) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.array()
        });
    }

    // Default error
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// 404 Not Found Handler
const notFound = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = {
    errorHandler,
    notFound
};
