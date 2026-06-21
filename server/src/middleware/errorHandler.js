const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Handle Sequelize Unique Constraint / Validation errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: err.errors ? err.errors[0].message : 'Duplicate field entry error.'
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: err.errors ? err.errors.map(e => e.message).join(', ') : 'Database validation failed.'
    });
  }

  // Default Express server error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
