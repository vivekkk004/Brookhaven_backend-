import Order from '../models/Order.js';
import Book from '../models/Book.js';
import { sendSuccess, sendError, sendControllerError } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';

// POST /orders  —  customer places an order
export const placeOrder = async (req, res) => {
    try {
        const { bookId, shippingAddress, paymentMethod = 'cod' } = req.body;
        const quantity = Number(req.body.quantity ?? 1);

        const book = await Book.findOne({ _id: bookId, isActive: true });
        if (!book) return sendError(res, 'Book not found', 404);
        if (book.stock < quantity) return sendError(res, 'Insufficient stock', 409);
        if (String(book.seller) === String(req.user._id)) {
            return sendError(res, 'You cannot buy your own book', 400);
        }

        const totalAmount = book.price * quantity;

        // Reserve inventory atomically so concurrent requests cannot oversell.
        const reservedBook = await Book.findOneAndUpdate(
            { _id: book._id, isActive: true, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true }
        );
        if (!reservedBook) return sendError(res, 'Insufficient stock', 409);

        let order;
        try {
            order = await Order.create({
                customer: req.user._id,
                seller: book.seller,
                book: book._id,
                quantity,
                price: book.price,
                totalAmount,
                shippingAddress,
                paymentDetails: { method: paymentMethod, status: 'pending' },
            });
        } catch (err) {
            await Book.updateOne({ _id: book._id }, { $inc: { stock: quantity } });
            throw err;
        }

        await order.populate([
            { path: 'book', select: 'title author images price' },
            { path: 'seller', select: 'name email' },
        ]);

        return sendSuccess(res, order, 'Order placed successfully', 201);
    } catch (err) {
        return sendControllerError(res, err);
    }
};

// GET /orders/customer
export const getCustomerOrders = async (req, res) => {
    try {
        const { skip, limit, buildMeta } = getPagination(req.query);
        const filter = { customer: req.user._id };

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('book', 'title author images price')
                .populate('seller', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Order.countDocuments(filter),
        ]);

        return sendSuccess(res, { orders }, 'Customer orders', 200, buildMeta(total));
    } catch (err) {
        return sendControllerError(res, err);
    }
};

// GET /orders/seller
export const getSellerOrders = async (req, res) => {
    try {
        const { skip, limit, buildMeta } = getPagination(req.query);
        const filter = { seller: req.user._id };

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('book', 'title author images price')
                .populate('customer', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Order.countDocuments(filter),
        ]);

        return sendSuccess(res, { orders }, 'Seller orders', 200, buildMeta(total));
    } catch (err) {
        return sendControllerError(res, err);
    }
};

// GET /orders/:id
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('book', 'title author images price description condition')
            .populate('customer', 'name email phone')
            .populate('seller', 'name email phone');

        if (!order) return sendError(res, 'Order not found', 404);

        const isOwner =
            String(order.customer._id) === String(req.user._id) ||
            String(order.seller._id) === String(req.user._id);

        if (!isOwner && req.user.role !== 'admin') {
            return sendError(res, 'Forbidden', 403);
        }

        return sendSuccess(res, order, 'Order details');
    } catch (err) {
        return sendControllerError(res, err);
    }
};

// PATCH /orders/:id/accept
export const acceptOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, seller: req.user._id });
        if (!order) return sendError(res, 'Order not found', 404);
        if (order.status !== 'pending') return sendError(res, 'Only pending orders can be accepted', 409);

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: order._id, seller: req.user._id, status: 'pending' },
            { $set: { status: 'accepted' } },
            { new: true }
        );
        if (!updatedOrder) return sendError(res, 'Order has already changed', 409);
        order.status = updatedOrder.status;
        return sendSuccess(res, order, 'Order accepted');
    } catch (err) {
        return sendControllerError(res, err);
    }
};

// PATCH /orders/:id/reject
export const rejectOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, seller: req.user._id, status: { $in: ['pending', 'accepted'] } },
            { $set: { status: 'rejected', rejectionReason: req.body?.reason || '' } },
            { new: true }
        );
        if (!order) {
            const existing = await Order.exists({ _id: req.params.id, seller: req.user._id });
            return existing
                ? sendError(res, 'Order cannot be rejected at its current stage', 409)
                : sendError(res, 'Order not found', 404);
        }

        // Restore stock
        await Book.updateOne({ _id: order.book }, { $inc: { stock: order.quantity } });

        return sendSuccess(res, order, 'Order rejected');
    } catch (err) {
        return sendControllerError(res, err);
    }
};

// PATCH /orders/:id/status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['shipped', 'completed'];

        if (!allowed.includes(status)) return sendError(res, `Status must be one of: ${allowed.join(', ')}`, 400);

        const expectedStatus = status === 'shipped' ? 'accepted' : 'shipped';
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, seller: req.user._id, status: expectedStatus },
            { $set: { status } },
            { new: true }
        );
        if (!order) {
            const existing = await Order.exists({ _id: req.params.id, seller: req.user._id });
            return existing
                ? sendError(res, 'Order cannot transition to this status', 409)
                : sendError(res, 'Order not found', 404);
        }
        return sendSuccess(res, order, `Order marked as ${status}`);
    } catch (err) {
        return sendControllerError(res, err);
    }
};

// PATCH /orders/:id/cancel  — customer cancels a pending order
export const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, customer: req.user._id, status: 'pending' },
            { $set: { status: 'cancelled' } },
            { new: true }
        );
        if (!order) {
            const existing = await Order.exists({ _id: req.params.id, customer: req.user._id });
            return existing
                ? sendError(res, 'Only pending orders can be cancelled', 409)
                : sendError(res, 'Order not found', 404);
        }
        // Restore stock
        await Book.updateOne({ _id: order.book }, { $inc: { stock: order.quantity } });

        return sendSuccess(res, order, 'Order cancelled');
    } catch (err) {
        return sendControllerError(res, err);
    }
};
