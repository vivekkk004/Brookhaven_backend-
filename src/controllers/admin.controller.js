import User from '../models/User.js';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import { sendSuccess, sendError } from '../utils/response.js';

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
        sendError(res, err.message, 500);
    }
};

// ─── Users Management ─────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '' } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role) query.role = role;

        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
            User.countDocuments(query),
        ]);

        sendSuccess(res, {
            users,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        sendError(res, err.message, 500);
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
        sendError(res, err.message, 500);
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
        sendError(res, err.message, 500);
    }
};

// ─── Books Management ─────────────────────────────────────────────────────────
export const getAllAdminBooks = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const query = search ? { title: { $regex: search, $options: 'i' } } : {};
        const skip = (Number(page) - 1) * Number(limit);

        const [books, total] = await Promise.all([
            Book.find(query)
                .populate('seller', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Book.countDocuments(query),
        ]);

        sendSuccess(res, {
            books,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        sendError(res, err.message, 500);
    }
};

export const deleteAdminBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return sendError(res, 'Book not found', 404);
        sendSuccess(res, null, 'Book deleted');
    } catch (err) {
        sendError(res, err.message, 500);
    }
};

// ─── Orders Management ────────────────────────────────────────────────────────
export const getAllAdminOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;
        const query = status ? { status } : {};
        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('customer', 'name email')
                .populate('seller', 'name email')
                .populate('book', 'title images price')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Order.countDocuments(query),
        ]);

        sendSuccess(res, {
            orders,
            pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        sendError(res, err.message, 500);
    }
};
