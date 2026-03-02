import User from '../models/User.js';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import { sendSuccess, sendError } from '../utils/response.js';

// GET /user/profile
export const getProfile = async (req, res) => {
    try {
        return sendSuccess(res, req.user, 'Seller profile');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// PUT /user/profile
export const updateProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return sendError(res, 'User not found', 404);

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (req.file) user.avatar = `/uploads/books/${req.file.filename}`;

        await user.save();
        return sendSuccess(res, user, 'Profile updated');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// GET /user/dashboard
export const getDashboard = async (req, res) => {
    try {
        const [totalListings, activeListings, totalOrders, pendingOrders, completedOrders] = await Promise.all([
            Book.countDocuments({ seller: req.user._id }),
            Book.countDocuments({ seller: req.user._id, isActive: true }),
            Order.countDocuments({ seller: req.user._id }),
            Order.countDocuments({ seller: req.user._id, status: 'pending' }),
            Order.countDocuments({ seller: req.user._id, status: 'completed' }),
        ]);

        // Total revenue from completed orders
        const revenueAgg = await Order.aggregate([
            { $match: { seller: req.user._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        const recentOrders = await Order.find({ seller: req.user._id })
            .populate('book', 'title author images')
            .populate('customer', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        return sendSuccess(res, {
            stats: { totalListings, activeListings, totalOrders, pendingOrders, completedOrders, totalRevenue },
            recentOrders,
        }, 'Seller dashboard');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// GET /user/earnings
export const getEarnings = async (req, res) => {
    try {
        // Monthly earnings for last 12 months
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);
        twelveMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyEarnings = await Order.aggregate([
            {
                $match: {
                    seller: req.user._id,
                    status: 'completed',
                    createdAt: { $gte: twelveMonthsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const lifetimeRevenue = await Order.aggregate([
            { $match: { seller: req.user._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        ]);

        return sendSuccess(res, {
            monthlyEarnings,
            lifetime: lifetimeRevenue[0] || { total: 0, count: 0 },
        }, 'Earnings data');
    } catch (err) {
        return sendError(res, err.message);
    }
};
