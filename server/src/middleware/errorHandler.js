export function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: 'Validasi gagal', details: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, error: `${field} sudah digunakan` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'ID tidak valid' });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Terjadi kesalahan internal server'
    : err.message || 'Terjadi kesalahan internal server';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

export function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} tidak ditemukan` });
}