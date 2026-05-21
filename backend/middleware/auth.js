const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Retrieve token from Authorization header or Custom Header
  const authHeader = req.header('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = req.header('x-auth-token');
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({ msg: 'Access Denied: No Authentication Token Found' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'nse_bse_financial_secret_token_key_987654321'
    );
    req.user = decoded; // Attach payload (contains _id, email, username)
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Session expired or invalid token. Please log in again.' });
  }
};
