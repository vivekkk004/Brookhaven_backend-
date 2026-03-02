import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import User from '../models/User.js';

/**
 * verifyToken — reads Bearer token from Authorization header or accessToken cookie.
 * Attaches req.user = { _id, name, email, role }
 */
export const verifyToken = async (req, res, next) => {
    try {
        let token = null;

        // 1. Check Authorization header
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // 2. Fallback — check cookie
        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return sendError(res, 'Access token required', 401);
        }

        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded._id).select('-password');

        if (!user || !user.isActive) {
            return sendError(res, 'User not found or inactive', 401);
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return sendError(res, 'Token expired', 401);
        }
        return sendError(res, 'Invalid token', 401);
    }
};

/**
 * requireRole(...roles) — must be used after verifyToken.
 * Example: requireRole('admin', 'user')
 */
export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return sendError(res, 'Not authenticated', 401);
    if (!roles.includes(req.user.role)) {
        return sendError(res, 'Forbidden: insufficient role', 403);
    }
    next();
};
