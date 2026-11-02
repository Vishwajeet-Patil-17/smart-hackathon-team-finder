import jwt from 'jsonwebtoken';

let warnedMissingSecret = false;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (!warnedMissingSecret) {
      console.warn('[AI Studio] JWT_SECRET not set — using ephemeral development secret.');
      warnedMissingSecret = true;
    }
    return 'wce-smart-hackathon-ephemeral-dev-jwt-secret';
  }
  return secret;
}

export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. Missing or invalid Authorization header.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = {
      id: decoded.id,
      email: decoded.email,
      fullName: decoded.fullName,
      department: decoded.department,
      academicYear: decoded.academicYear,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expired or invalid authentication token.' });
  }
}
