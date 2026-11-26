import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'bhoomi-setu-meghraj-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '12h';

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function sanitizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    credentialCode: u.credential_code,
    stateCode: u.state_code,
    district: u.district,
    phone: u.phone,
    vidToken: u.vid_token,
    linkedParcelId: u.linked_parcel_id,
    preferredLang: u.preferred_lang,
    createdAt: u.created_at
  };
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const bearerToken = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = bearerToken || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in to BhoomiSetu.' });
  }

  try {
    const claims = verifyAuthToken(token);
    const user = db.getUserById(claims.sub);
    if (!user) return res.status(401).json({ error: 'Authenticated session account no longer exists.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired JWT session token.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Statutory RBAC block: requires role [${roles.join(' / ')}]. Active role: ${req.user?.role || 'none'}.`
      });
    }
    next();
  };
}

/**
 * Validates stakeholder credential identifiers (NIC Parichay ID, CALA Code, VID Token, or PSU Code).
 */
export function verifyStakeholderCredential(role, rawCode = '') {
  const clean = String(rawCode || '').trim().toUpperCase();
  if (role === 'collector') {
    if (/^NIC-DM-[A-Z]{2}\d{2,4}$/.test(clean) || /^DM-[A-Z0-9-]{3,}$/.test(clean)) {
      return { verified: true, code: clean, authority: 'MeghRaj NIC Parichay · District Magistrate SSO' };
    }
    return { verified: false, error: 'Collector ID must match NIC-DM-XX00 (e.g., NIC-DM-UP09).' };
  }
  if (role === 'officer') {
    if (/^CALA-[A-Z]{2}-\d{2,4}$/.test(clean) || /^LAO-[A-Z0-9-]{3,}$/.test(clean)) {
      return { verified: true, code: clean, authority: 'State Revenue / DILRMP CALA Registry' };
    }
    return { verified: false, error: 'CALA/Officer ID must match CALA-XX-000 (e.g., CALA-UP-044).' };
  }
  if (role === 'agency') {
    if (/^(NHAI|RAIL|METRO|PGCIL|PSU|NICDC)-[A-Z0-9-]{2,}$/.test(clean)) {
      return { verified: true, code: clean, authority: 'PM GatiShakti NMP Infrastructure Agency Gate' };
    }
    return { verified: false, error: 'Agency ID must start with NHAI-, RAIL-, METRO-, PGCIL-, or PSU-.' };
  }
  if (role === 'farmer') {
    if (/^VID-\d{4}-\d{4}-\d{4}$/.test(clean) || /^ULPIN-\d{14}$/.test(clean) || clean === '') {
      return { verified: true, code: clean || 'VID-AUTO-PROVISIONED', authority: 'UIDAI Zero-PII VID Tokenization' };
    }
    return { verified: false, error: 'Farmer VID must match VID-XXXX-XXXX-XXXX or leave blank for auto-VID.' };
  }
  return { verified: false, error: 'Unsupported stakeholder role.' };
}
