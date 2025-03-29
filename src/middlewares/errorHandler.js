module.exports = (err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Error en el servidor';
    
    console.error(err.stack);
    
    res.status(status).json({
      success: false,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  };