export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Mongoose Validierungsfehler
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validierungsfehler',
      errors
    });
  }

  // Mongoose CastError (ungültige ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Ungültige ID'
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Dieser Eintrag existiert bereits'
    });
  }

  // Standard Server Error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Interner Serverfehler',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};


