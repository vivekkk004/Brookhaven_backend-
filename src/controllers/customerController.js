import User from '../models/User.js';
import Order from '../models/Order.js';
import Wishlist from '../models/Wishlist.js';
import { sendSuccess, sendError } from '../utils/response.js';

// GET /customer/profile
export const getProfile = async (req, res) => {
    try {
        return sendSuccess(res, req.user, 'Customer profile');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// PUT /customer/profile
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

// GET /customer/dashboard
export const getDashboard = async (req, res) => {
    try {
        const [totalOrders, pendingOrders, completedOrders, wishlistCount] = await Promise.all([
            Order.countDocuments({ customer: req.user._id }),
            Order.countDocuments({ customer: req.user._id, status: 'pending' }),
            Order.countDocuments({ customer: req.user._id, status: 'completed' }),
            Wishlist.countDocuments({ customer: req.user._id }),
        ]);

        const recentOrders = await Order.find({ customer: req.user._id })
            .populate('book', 'title author images price')
            .sort({ createdAt: -1 })
            .limit(5);

        return sendSuccess(res, {
            stats: { totalOrders, pendingOrders, completedOrders, wishlistCount },
            recentOrders,
        }, 'Dashboard data');
    } catch (err) {
        return sendError(res, err.message);
    }
};
