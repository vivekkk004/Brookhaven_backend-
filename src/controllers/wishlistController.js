import Wishlist from '../models/Wishlist.js';
import Book from '../models/Book.js';
import { sendSuccess, sendError } from '../utils/response.js';

// GET /wishlist
export const getWishlist = async (req, res) => {
    try {
        const items = await Wishlist.find({ customer: req.user._id })
            .populate('book', 'title author price condition images rating reviewCount')
            .sort({ createdAt: -1 });
        return sendSuccess(res, items, 'Wishlist fetched');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// POST /wishlist/:bookId
export const addToWishlist = async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.bookId, isActive: true });
        if (!book) return sendError(res, 'Book not found', 404);

        const item = await Wishlist.create({ customer: req.user._id, book: req.params.bookId });
        await item.populate('book', 'title author price condition images');
        return sendSuccess(res, item, 'Added to wishlist', 201);
    } catch (err) {
        if (err.code === 11000) return sendError(res, 'Already in wishlist', 409);
        return sendError(res, err.message);
    }
};

// DELETE /wishlist/:bookId
export const removeFromWishlist = async (req, res) => {
    try {
        const item = await Wishlist.findOneAndDelete({ customer: req.user._id, book: req.params.bookId });
        if (!item) return sendError(res, 'Item not found in wishlist', 404);
        return sendSuccess(res, null, 'Removed from wishlist');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// DELETE /wishlist  — clear all
export const clearWishlist = async (req, res) => {
    try {
        await Wishlist.deleteMany({ customer: req.user._id });
        return sendSuccess(res, null, 'Wishlist cleared');
    } catch (err) {
        return sendError(res, err.message);
    }
};
