const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Express Middleware that validates Supabase Session Access Tokens
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Missing session token.' });
  }

  // Use the official client to safely pull user parameters from Supabase's identity engine
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(403).json({ error: 'Invalid or expired authentication session.' });
  }

  // Inject user profile details into the request state
  req.user = {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || 'user' // Default safe authorization scope
  };
  
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Access restricted. Requires role: ${role}` });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };