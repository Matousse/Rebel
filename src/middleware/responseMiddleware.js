// src/middleware/responseMiddleware.js
const { successResponse, errorResponse } = require('../utils/responseUtils');

module.exports = (req, res, next) => {
  // Add success and error methods to the response object
  res.success = (data = null, message = 'Success', statusCode = 200, meta = null) => {
    return successResponse(res, statusCode, message, data, meta);
  };
  
  res.error = (message = 'Error', statusCode = 500, errors = null) => {
    return errorResponse(res, statusCode, message, errors);
  };
  
  next();
};