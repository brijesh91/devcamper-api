//custom error handler middleware, included in server.js

const ErrorResponse = require('../utils/errorResponse')
const errorHandler = (err, req, res, next) => {
    let error = { ...err }

    // Log to console for dev
    // console.log(err)

    error.message = err.message

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found`
        error = new ErrorResponse(message, 404)
    }

    // Mongoose duplicate value error
    if (err.code === 11000) {
        const message = 'Duplicate field value entered'
        error = new ErrorResponse(message, 400)
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {

        // To extract value for key message present in errors object
        // map function will check each array element and get its message property only
        // and store it in message array
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message, 400)
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
    })
}

module.exports = errorHandler