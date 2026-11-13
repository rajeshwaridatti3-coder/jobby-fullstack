export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error?.code === 'P2002') {
    return res.status(409).json({ message: 'This record already exists.' });
  }
  if (error?.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found.' });
  }
  const status = error.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Something went wrong on the server.' : error.message
  });
}
