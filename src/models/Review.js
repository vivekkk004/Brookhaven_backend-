import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '', trim: true },
    },
    { timestamps: true }
);

// One review per user per book
reviewSchema.index({ book: 1, customer: 1 }, { unique: true });

// Update book rating after save or remove
const updateBookRating = async (bookId) => {
    const stats = await mongoose.model('Review').aggregate([
        { $match: { book: bookId } },
        { $group: { _id: '$book', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
        await mongoose.model('Book').findByIdAndUpdate(bookId, {
            rating: Math.round(stats[0].avgRating * 10) / 10,
            reviewCount: stats[0].count,
        });
    } else {
        await mongoose.model('Book').findByIdAndUpdate(bookId, { rating: 0, reviewCount: 0 });
    }
};

reviewSchema.post('save', function () { updateBookRating(this.book); });
reviewSchema.post('findOneAndDelete', function (doc) { if (doc) updateBookRating(doc.book); });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
