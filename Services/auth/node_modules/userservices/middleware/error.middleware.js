const logger = require('../config/logger');

// Custom error class for API errors
class ApiError extends Error {
    constructor(statusCode, message, details = null, stack = '') { // Corrected: details before stack
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Log the error with contextual information
    logger.error(`${message}`, {
        statusCode,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user ? req.user._id : 'unauthenticated',
        stack: err.stack
    });

    const stack = process.env.NODE_ENV === 'development' ? err.stack : {};

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
        ...(err.details && { errors: err.details }),  // ✅ Add this line
        ...(process.env.NODE_ENV === 'development' && { stack })
    });
};


// Handle 404 errors
const notFound = (req, res, next) => {
    const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
    next(error);
};

module.exports = {
    ApiError,
    errorHandler,
    notFound
};