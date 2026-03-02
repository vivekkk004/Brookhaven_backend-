import User from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';

const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
};

// POST /auth/register
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existing = await User.findOne({ email });
        if (existing) return sendError(res, 'Email already registered', 409);

        // Only allow customer or user (seller) to register publicly
        const allowedRoles = ['customer', 'user'];
        const userRole = allowedRoles.includes(role) ? role : 'customer';

        const user = await User.create({ name, email, password, role: userRole });
        const payload = { _id: user._id, role: user.role };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

        return sendSuccess(res, { user, accessToken }, 'Registered successfully', 201);
    } catch (err) {
        return sendError(res, err.message);
    }
};

// POST /auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.isActive) return sendError(res, 'Invalid credentials', 401);

        const match = await user.comparePassword(password);
        if (!match) return sendError(res, 'Invalid credentials', 401);

        const payload = { _id: user._id, role: user.role };
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

        const safeUser = user.toJSON();
        return sendSuccess(res, { user: safeUser, accessToken, role: user.role }, 'Login successful');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// POST /auth/logout
export const logout = async (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return sendSuccess(res, null, 'Logged out successfully');
};

// POST /auth/refresh
export const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return sendError(res, 'Refresh token required', 401);

        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded._id);
        if (!user || !user.isActive) return sendError(res, 'User not found', 401);

        const payload = { _id: user._id, role: user.role };
        const accessToken = signAccessToken(payload);

        res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
        return sendSuccess(res, { accessToken }, 'Token refreshed');
    } catch (err) {
        return sendError(res, 'Invalid or expired refresh token', 401);
    }
};

// GET /auth/me
export const me = async (req, res) => {
    return sendSuccess(res, req.user, 'Current user');
};
