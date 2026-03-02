import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        author: { type: String, required: true, trim: true },
        year: { type: Number },
        price: { type: Number, required: true, min: 0 },
        condition: { type: String, enum: ['Fair', 'Good', 'Very Good', 'Excellent'], required: true },
        category: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        images: [{ type: String }],   // array of image URLs / paths
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        stock: { type: Number, default: 1, min: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Text index for full-text search
bookSchema.index({ title: 'text', author: 'text', category: 'text', description: 'text' });

const Book = mongoose.model('Book', bookSchema);
export default Book;
