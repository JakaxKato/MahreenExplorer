export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'Route tidak ditemukan', code: 'NOT_FOUND' } });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  res.status(status).json({
    error: {
      message: status === 500 ? 'Terjadi kesalahan pada server' : error.message,
      code: error.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR')
    }
  });
}
