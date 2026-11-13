import User from '../models/User.js';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import { sendSuccess, sendError, sendControllerError } from '../utils/response.js';

const getAdminPage = (query) => {
    const parsedPage = Number.parseInt(query.page, 10);
    const parsedLimit = Number.parseInt(query.limit, 10);
    const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit = Number.isSafeInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;
    return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 100);

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalBooks, totalOrders, revenueAgg, recentOrders] = await Promise.all([
            User.countDocuments({ isActive: true }),
            Book.countDocuments(),
            Order.countDocuments(),
            Order.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('customer', 'name email')
                .populate('book', 'title images')
                .lean(),
        ]);

        const totalRevenue = revenueAgg[0]?.total || 0;

        // Orders by status
        const statusCounts = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const orderStats = {};
        statusCounts.forEach(s => { orderStats[s._id] = s.count; });

        // Users by role
        const roleCounts = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
        ]);
        const userStats = {};
        roleCounts.forEach(r => { userStats[r._id] = r.count; });

        sendSuccess(res, {
            totalUsers,
            totalBooks,
            totalOrders,
            totalRevenue,
            orderStats,
            userStats,
            recentOrders: recentOrders.map(o => ({
                id: o._id,
                customer: o.customer?.name,
                book: o.book?.title,
                amount: o.totalAmount,
                status: o.status,
                date: o.createdAt,
            })),
        });
    } catch (err) {
        sendControllerError(res, err);
    }
};

// ─── Users Management ─────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
    try {
        const { search = '', role = '' } = req.query;
        const { page, limit, skip } = getAdminPage(req.query);
        const query = {};
        if (search) {
            const safeSearch = escapeRegex(String(search));
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
            ];
        }
        if (role) query.role = role;

        const [users, total] = await Promise.all([
            User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(query),
        ]);

        sendSuccess(res, {
            users,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        sendControllerError(res, err);
    }
};

export const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return sendError(res, 'User not found', 404);
        if (user.role === 'admin') return sendError(res, 'Cannot deactivate an admin', 403);

        user.isActive = !user.isActive;
        await user.save();
        sendSuccess(res, { id: user._id, isActive: user.isActive }, `User ${user.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
        sendControllerError(res, err);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return sendError(res, 'User not found', 404);
        if (user.role === 'admin') return sendError(res, 'Cannot delete an admin', 403);

        await User.findByIdAndDelete(req.params.id);
        sendSuccess(res, null, 'User deleted');
    } catch (err) {
        sendControllerError(res, err);
    }
};

// ─── Books Management ─────────────────────────────────────────────────────────
export const getAllAdminBooks = async (req, res) => {
    try {
        const { search = '' } = req.query;
        const { page, limit, skip } = getAdminPage(req.query);
        const query = search ? { title: { $regex: escapeRegex(String(search)), $options: 'i' } } : {};

        const [books, total] = await Promise.all([
            Book.find(query)
                .populate('seller', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Book.countDocuments(query),
        ]);

        sendSuccess(res, {
            books,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        sendControllerError(res, err);
    }
};

export const deleteAdminBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return sendError(res, 'Book not found', 404);
        sendSuccess(res, null, 'Book deleted');
    } catch (err) {
        sendControllerError(res, err);
    }
};

// ─── Orders Management ────────────────────────────────────────────────────────
export const getAllAdminOrders = async (req, res) => {
    try {
        const { status = '' } = req.query;
        const { page, limit, skip } = getAdminPage(req.query);
        const query = status ? { status } : {};

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('customer', 'name email')
                .populate('seller', 'name email')
                .populate('book', 'title images price')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
        ]);

        sendSuccess(res, {
            orders,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        sendControllerError(res, err);
    }
};
