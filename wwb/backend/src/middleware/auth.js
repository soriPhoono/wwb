const jwt = require('jsonwebtoken');
const fs = require('fs');

function getJwtSecret() {
  // Support Docker Swarm secret: mount the JWT secret as a secret file
  if (process.env.JWT_SECRET_FILE) {
    try {
      return fs.readFileSync(process.env.JWT_SECRET_FILE, 'utf8').trim();
    } catch (e) {
      console.error('Could not read JWT_SECRET_FILE:', e.message);
    }
  }
  return process.env.JWT_SECRET || 'dev-secret-change-in-production';
}

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth, getJwtSecret };
