export function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = userId.trim();
  next();
}

export function extractUser(req, res, next) {
  const userId = req.headers['x-user-id'];
  req.userId = (userId && typeof userId === 'string') ? userId.trim() : null;
  next();
}
