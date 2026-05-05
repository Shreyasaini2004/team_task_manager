export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;

  if (error.code === 11000) {
    res.status(409).json({
      message: 'A record with this value already exists'
    });
    return;
  }

  if (error.name === 'ValidationError') {
    res.status(400).json({
      message: 'Validation failed',
      details: Object.values(error.errors).map((issue) => ({
        path: issue.path,
        message: issue.message
      }))
    });
    return;
  }

  if (error.name === 'CastError') {
    res.status(400).json({
      message: 'Invalid id format'
    });
    return;
  }

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    message: status >= 500 ? 'Something went wrong' : error.message,
    details: error.details
  });
}
