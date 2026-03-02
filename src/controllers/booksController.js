import Book from '../models/Book.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';
import path from 'path';

// GET /books
export const getBooks = async (req, res) => {
    try {
        const { category, condition, minPrice, maxPrice, sortBy, search } = req.query;
        const { skip, limit, buildMeta } = getPagination(req.query);

        const filter = { isActive: true };

        if (category) filter.category = category;
        if (condition) filter.condition = condition;

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        if (search) {
            filter.$text = { $search: search };
        }

        let sortOption = { createdAt: -1 };
        if (sortBy === 'price-low') sortOption = { price: 1 };
        if (sortBy === 'price-high') sortOption = { price: -1 };
        if (sortBy === 'rating') sortOption = { rating: -1 };
        if (sortBy === 'newest') sortOption = { createdAt: -1 };

        const [books, total] = await Promise.all([
            Book.find(filter)
                .populate('seller', 'name email avatar rating')
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            Book.countDocuments(filter),
        ]);

        return sendSuccess(res, { books }, 'Books fetched', 200, buildMeta(total));
    } catch (err) {
        return sendError(res, err.message);
    }
};

// GET /books/my  — seller's own listings
export const getMyBooks = async (req, res) => {
    try {
        const { skip, limit, buildMeta } = getPagination(req.query);
        const filter = { seller: req.user._id };

        const [books, total] = await Promise.all([
            Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Book.countDocuments(filter),
        ]);

        return sendSuccess(res, { books }, 'My listings', 200, buildMeta(total));
    } catch (err) {
        return sendError(res, err.message);
    }
};

// GET /books/:id
export const getBookById = async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, isActive: true })
            .populate('seller', 'name email avatar');

        if (!book) return sendError(res, 'Book not found', 404);
        return sendSuccess(res, book, 'Book details');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// POST /books  — seller creates a listing
export const createBook = async (req, res) => {
    try {
        const { title, author, year, price, condition, category, description, stock } = req.body;

        // Handle uploaded images
        const images = req.files
            ? req.files.map(f => `/uploads/books/${f.filename}`)
            : req.body.images
                ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images])
                : [];

        const book = await Book.create({
            title, author, year, price, condition, category, description, stock,
            images,
            seller: req.user._id,
        });

        return sendSuccess(res, book, 'Book listed successfully', 201);
    } catch (err) {
        return sendError(res, err.message);
    }
};

// PUT /books/:id
export const updateBook = async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, seller: req.user._id });
        if (!book) return sendError(res, 'Book not found or not your listing', 404);

        const fields = ['title', 'author', 'year', 'price', 'condition', 'category', 'description', 'stock'];
        fields.forEach(f => { if (req.body[f] !== undefined) book[f] = req.body[f]; });

        if (req.files && req.files.length > 0) {
            book.images = req.files.map(f => `/uploads/books/${f.filename}`);
        }

        await book.save();
        return sendSuccess(res, book, 'Book updated');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// DELETE /books/:id  — soft delete
export const deleteBook = async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, seller: req.user._id });
        if (!book) return sendError(res, 'Book not found or not your listing', 404);

        book.isActive = false;
        await book.save();
        return sendSuccess(res, null, 'Book removed from listings');
    } catch (err) {
        return sendError(res, err.message);
    }
};
