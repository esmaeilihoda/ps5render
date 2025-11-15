import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
const header = req.headers.authorization || '';
const [scheme, token] = header.split(' ');
if (scheme !== 'Bearer' || !token) {
return res.status(401).json({ success: false, message: 'Unauthorized' });
}
try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = { id: payload.sub, role: payload.role };
next();
} catch {
return res.status(401).json({ success: false, message: 'Invalid or expired token' });
}
}

export function requireRole(role) {
return (req, res, next) => {
if (!req.user || req.user.role !== role) {
return res.status(403).json({ success: false, message: 'Forbidden' });
}
next();
};
}

export const requireAdmin = requireRole('ADMIN');