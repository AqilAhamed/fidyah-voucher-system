const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to verify JWT tokens on protected routes.
 * Checks the Authorization: Bearer <token> header.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Role-based access guard. Use after authenticateToken.
 * e.g. requireRole('admin'), requireRole('merchant')
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Access restricted to ${role} accounts.` });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
