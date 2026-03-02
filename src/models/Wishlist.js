import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
    {
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    },
    { timestamps: true }
);

// Prevent duplicate entries per user-book pair
wishlistSchema.index({ customer: 1, book: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist;
