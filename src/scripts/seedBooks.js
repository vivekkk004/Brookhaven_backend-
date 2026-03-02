/**
 * Seed script — populates the DB with sample books.
 * Run: node src/scripts/seedBooks.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import models after env loaded
const { default: Book } = await import('../models/Book.js');
const { default: User } = await import('../models/User.js');

const MONGO_URI = process.env.MONGO_URI_DEV || 'mongodb://127.0.0.1:27017/bookhaven';

const sampleBooks = [
    {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        year: 1813,
        price: 45.99,
        condition: 'Good',
        category: 'Classic Literature',
        description: 'A timeless romance novel exploring themes of love, class, and society in Regency England.',
        images: ['https://covers.openlibrary.org/b/id/8231986-L.jpg'],
        stock: 3,
    },
    {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        year: 1925,
        price: 38.50,
        condition: 'Very Good',
        category: 'Classic Literature',
        description: 'A critique of the American Dream set in the Jazz Age, following the mysterious Jay Gatsby.',
        images: ['https://covers.openlibrary.org/b/id/7222246-L.jpg'],
        stock: 5,
    },
    {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        year: 1960,
        price: 52.00,
        condition: 'Excellent',
        category: 'Classic Literature',
        description: 'A powerful story of racial injustice and childhood innocence in the American South.',
        images: ['https://covers.openlibrary.org/b/id/8231984-L.jpg'],
        stock: 2,
    },
    {
        title: '1984',
        author: 'George Orwell',
        year: 1949,
        price: 42.75,
        condition: 'Good',
        category: 'Science Fiction',
        description: 'A dystopian masterpiece depicting a totalitarian future society under constant surveillance.',
        images: ['https://covers.openlibrary.org/b/id/7222246-L.jpg'],
        stock: 4,
    },
    {
        title: 'Jane Eyre',
        author: 'Charlotte Brontë',
        year: 1847,
        price: 48.99,
        condition: 'Very Good',
        category: 'Classic Literature',
        description: 'A Gothic romance following the experiences of the orphaned Jane Eyre.',
        images: ['https://covers.openlibrary.org/b/id/8231986-L.jpg'],
        stock: 3,
    },
    {
        title: 'Moby-Dick',
        author: 'Herman Melville',
        year: 1851,
        price: 65.00,
        condition: 'Fair',
        category: 'Adventure',
        description: "The epic tale of Captain Ahab's obsessive quest to hunt the white whale.",
        images: ['https://covers.openlibrary.org/b/id/7222246-L.jpg'],
        stock: 1,
    },
];

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅  Connected to MongoDB');

        // Create or find a seed seller account
        let seller = await User.findOne({ email: 'seller@bookhaven.com' });
        if (!seller) {
            seller = await User.create({
                name: 'BookHaven Store',
                email: 'seller@bookhaven.com',
                password: 'Seller@123',
                role: 'user',
            });
            console.log('📦  Created seed seller: seller@bookhaven.com / Seller@123');
        }

        // Create or find a seed customer account
        let customer = await User.findOne({ email: 'customer@bookhaven.com' });
        if (!customer) {
            customer = await User.create({
                name: 'Test Customer',
                email: 'customer@bookhaven.com',
                password: 'Customer@123',
                role: 'customer',
            });
            console.log('👤  Created seed customer: customer@bookhaven.com / Customer@123');
        }

        // Remove old seeded books and re-seed
        await Book.deleteMany({ seller: seller._id });

        const books = await Book.insertMany(
            sampleBooks.map(b => ({ ...b, seller: seller._id }))
        );

        console.log(`📚  Seeded ${books.length} books`);
        console.log('\n✨  Seed complete!\n');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err.message);
        process.exit(1);
    }
};

seed();
