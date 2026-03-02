import Review from '../models/Review.js';
import Book from '../models/Book.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';

// GET /reviews/book/:bookId
export const getBookReviews = async (req, res) => {
    try {
        const { skip, limit, buildMeta } = getPagination(req.query, 10);

        const [reviews, total] = await Promise.all([
            Review.find({ book: req.params.bookId })
                .populate('customer', 'name avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments({ book: req.params.bookId }),
        ]);

        return sendSuccess(res, { reviews }, 'Reviews fetched', 200, buildMeta(total));
    } catch (err) {
        return sendError(res, err.message);
    }
};

// POST /reviews/book/:bookId
export const addReview = async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.bookId, isActive: true });
        if (!book) return sendError(res, 'Book not found', 404);

        const review = await Review.create({
            book: req.params.bookId,
            customer: req.user._id,
            rating: req.body.rating,
            comment: req.body.comment || '',
        });

        await review.populate('customer', 'name avatar');
        return sendSuccess(res, review, 'Review added', 201);
    } catch (err) {
        if (err.code === 11000) return sendError(res, 'You have already reviewed this book', 409);
        return sendError(res, err.message);
    }
};

// PUT /reviews/:id
export const updateReview = async (req, res) => {
    try {
        const review = await Review.findOne({ _id: req.params.id, customer: req.user._id });
        if (!review) return sendError(res, 'Review not found', 404);

        if (req.body.rating !== undefined) review.rating = req.body.rating;
        if (req.body.comment !== undefined) review.comment = req.body.comment;

        await review.save();
        return sendSuccess(res, review, 'Review updated');
    } catch (err) {
        return sendError(res, err.message);
    }
};

// DELETE /reviews/:id
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findOneAndDelete({ _id: req.params.id, customer: req.user._id });
        if (!review) return sendError(res, 'Review not found', 404);
        return sendSuccess(res, null, 'Review deleted');
    } catch (err) {
        return sendError(res, err.message);
    }
};
