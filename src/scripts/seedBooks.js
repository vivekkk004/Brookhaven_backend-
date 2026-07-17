/**
 * Seed script — populates the DB with sample books.
 * Run: node src/scripts/seedBooks.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

// Import models after env loaded
const { default: Book } = await import('../models/Book.js');
const { default: User } = await import('../models/User.js');

const MONGO_URI = process.env.MONGO_URI_DEV || 'mongodb://127.0.0.1:27017/bookhaven';

const sampleBooks = [
    // ── Classic Literature ──────────────────────────────────────────────────
    {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        year: 1813,
        price: 199,
        condition: 'Good',
        category: 'Classic Literature',
        description: 'A timeless romance novel exploring themes of love, class, and society in Regency England. Follow Elizabeth Bennet as she navigates the complex social world of 19th-century England.',
        images: ['https://covers.openlibrary.org/b/id/8231986-L.jpg'],
        stock: 3,
        rating: 4.7,
        reviewCount: 142,
    },
    {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        year: 1925,
        price: 249,
        condition: 'Very Good',
        category: 'Classic Literature',
        description: 'A critique of the American Dream set in the Jazz Age, following the mysterious Jay Gatsby and his obsessive pursuit of Daisy Buchanan.',
        images: ['https://covers.openlibrary.org/b/id/7222246-L.jpg'],
        stock: 5,
        rating: 4.5,
        reviewCount: 238,
    },
    {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        year: 1960,
        price: 299,
        condition: 'Excellent',
        category: 'Classic Literature',
        description: 'A powerful story of racial injustice and childhood innocence in the American South, told through the eyes of young Scout Finch.',
        images: ['https://covers.openlibrary.org/b/id/8228691-L.jpg'],
        stock: 2,
        rating: 4.8,
        reviewCount: 312,
    },
    {
        title: 'Jane Eyre',
        author: 'Charlotte Brontë',
        year: 1847,
        price: 179,
        condition: 'Very Good',
        category: 'Classic Literature',
        description: 'A Gothic romance following the experiences of the orphaned Jane Eyre, her growth to adulthood, and her passionate love for Mr. Rochester.',
        images: ['https://covers.openlibrary.org/b/id/12803487-L.jpg'],
        stock: 3,
        rating: 4.6,
        reviewCount: 189,
    },
    {
        title: 'Wuthering Heights',
        author: 'Emily Brontë',
        year: 1847,
        price: 169,
        condition: 'Good',
        category: 'Classic Literature',
        description: 'A wild, passionate tale of the intense and almost demonic love between Catherine Earnshaw and Heathcliff on the Yorkshire moors.',
        images: ['https://covers.openlibrary.org/b/id/12818867-L.jpg'],
        stock: 4,
        rating: 4.3,
        reviewCount: 127,
    },

    // ── Science Fiction ──────────────────────────────────────────────────────
    {
        title: '1984',
        author: 'George Orwell',
        year: 1949,
        price: 229,
        condition: 'Good',
        category: 'Science Fiction',
        description: 'A dystopian masterpiece depicting a totalitarian future society under constant surveillance. Big Brother is watching you.',
        images: ['https://covers.openlibrary.org/b/id/12648655-L.jpg'],
        stock: 4,
        rating: 4.7,
        reviewCount: 456,
    },
    {
        title: 'Brave New World',
        author: 'Aldous Huxley',
        year: 1932,
        price: 259,
        condition: 'Very Good',
        category: 'Science Fiction',
        description: 'A thought-provoking novel set in a futuristic World State where citizens are genetically modified and socially conditioned to serve a ruling order.',
        images: ['https://covers.openlibrary.org/b/id/6553117-L.jpg'],
        stock: 3,
        rating: 4.4,
        reviewCount: 201,
    },
    {
        title: 'Dune',
        author: 'Frank Herbert',
        year: 1965,
        price: 349,
        condition: 'Excellent',
        category: 'Science Fiction',
        description: 'Set in the far future amidst a feudal interstellar society, Dune tells the story of young Paul Atreides on the desert planet Arrakis.',
        images: ['https://covers.openlibrary.org/b/id/11430471-L.jpg'],
        stock: 2,
        rating: 4.8,
        reviewCount: 523,
    },
    {
        title: 'The Hitchhiker\'s Guide to the Galaxy',
        author: 'Douglas Adams',
        year: 1979,
        price: 189,
        condition: 'Good',
        category: 'Science Fiction',
        description: 'Seconds before Earth is demolished for a galactic freeway, Arthur Dent is saved by Ford Prefect — and the galaxy\'s most remarkable adventure begins.',
        images: ['https://covers.openlibrary.org/b/id/12688775-L.jpg'],
        stock: 6,
        rating: 4.6,
        reviewCount: 389,
    },

    // ── Adventure ────────────────────────────────────────────────────────────
    {
        title: 'Moby-Dick',
        author: 'Herman Melville',
        year: 1851,
        price: 279,
        condition: 'Fair',
        category: 'Adventure',
        description: "The epic tale of Captain Ahab's obsessive quest to hunt the white whale, Moby Dick, across the world's oceans.",
        images: ['https://covers.openlibrary.org/b/id/12818524-L.jpg'],
        stock: 1,
        rating: 4.2,
        reviewCount: 98,
    },
    {
        title: 'The Adventures of Sherlock Holmes',
        author: 'Arthur Conan Doyle',
        year: 1892,
        price: 199,
        condition: 'Very Good',
        category: 'Adventure',
        description: 'A collection of twelve short stories featuring the famous detective Sherlock Holmes and his loyal companion Dr. Watson.',
        images: ['https://covers.openlibrary.org/b/id/12003680-L.jpg'],
        stock: 5,
        rating: 4.7,
        reviewCount: 267,
    },
    {
        title: 'Treasure Island',
        author: 'Robert Louis Stevenson',
        year: 1883,
        price: 149,
        condition: 'Good',
        category: 'Adventure',
        description: 'A coming-of-age story involving pirates, treasure maps, and the young Jim Hawkins\' adventure to find Captain Flint\'s buried treasure.',
        images: ['https://covers.openlibrary.org/b/id/12644766-L.jpg'],
        stock: 4,
        rating: 4.4,
        reviewCount: 156,
    },

    // ── Mystery ──────────────────────────────────────────────────────────────
    {
        title: 'Murder on the Orient Express',
        author: 'Agatha Christie',
        year: 1934,
        price: 219,
        condition: 'Good',
        category: 'Mystery',
        description: 'Hercule Poirot investigates a murder aboard the luxurious Orient Express train, where everyone is a suspect.',
        images: ['https://covers.openlibrary.org/b/id/12649498-L.jpg'],
        stock: 3,
        rating: 4.5,
        reviewCount: 234,
    },
    {
        title: 'The Girl with the Dragon Tattoo',
        author: 'Stieg Larsson',
        year: 2005,
        price: 329,
        condition: 'Excellent',
        category: 'Mystery',
        description: 'A journalist and a computer hacker investigate a wealthy family and uncover dark secrets in this gripping Swedish thriller.',
        images: ['https://covers.openlibrary.org/b/id/8764040-L.jpg'],
        stock: 2,
        rating: 4.6,
        reviewCount: 412,
    },
    {
        title: 'Gone Girl',
        author: 'Gillian Flynn',
        year: 2012,
        price: 289,
        condition: 'Very Good',
        category: 'Mystery',
        description: 'On their fifth wedding anniversary, Nick Dunne\'s wife Amy disappears. Under mounting pressure, Nick\'s portrait of a blissful union begins to crumble.',
        images: ['https://covers.openlibrary.org/b/id/8152957-L.jpg'],
        stock: 4,
        rating: 4.3,
        reviewCount: 345,
    },

    // ── Romance ──────────────────────────────────────────────────────────────
    {
        title: 'The Notebook',
        author: 'Nicholas Sparks',
        year: 1996,
        price: 179,
        condition: 'Good',
        category: 'Romance',
        description: 'A beautiful love story about Noah and Allie, whose youthful romance blossoms during one unforgettable summer.',
        images: ['https://covers.openlibrary.org/b/id/316930-L.jpg'],
        stock: 5,
        rating: 4.4,
        reviewCount: 267,
    },
    {
        title: 'Outlander',
        author: 'Diana Gabaldon',
        year: 1991,
        price: 359,
        condition: 'Excellent',
        category: 'Romance',
        description: 'Claire Randall, a former WWII nurse, is mysteriously transported back to 1743 Scotland where she encounters the dashing Highland warrior Jamie Fraser.',
        images: ['https://covers.openlibrary.org/b/id/8160657-L.jpg'],
        stock: 2,
        rating: 4.7,
        reviewCount: 489,
    },

    // ── Self-Help ────────────────────────────────────────────────────────────
    {
        title: 'Atomic Habits',
        author: 'James Clear',
        year: 2018,
        price: 399,
        condition: 'Excellent',
        category: 'Self-Help',
        description: 'An easy and proven way to build good habits and break bad ones. Transform your life with tiny changes that deliver remarkable results.',
        images: ['https://covers.openlibrary.org/b/id/10958382-L.jpg'],
        stock: 8,
        rating: 4.9,
        reviewCount: 678,
    },
    {
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        year: 2020,
        price: 349,
        condition: 'Very Good',
        category: 'Self-Help',
        description: 'Timeless lessons on wealth, greed, and happiness. Doing well with money isn\'t about what you know — it\'s about how you behave.',
        images: ['https://covers.openlibrary.org/b/id/12818660-L.jpg'],
        stock: 6,
        rating: 4.7,
        reviewCount: 534,
    },

    // ── Technology ───────────────────────────────────────────────────────────
    {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        year: 2008,
        price: 499,
        condition: 'Very Good',
        category: 'Technology',
        description: 'A handbook of agile software craftsmanship. Learn to write clean, maintainable code that stands the test of time.',
        images: ['https://covers.openlibrary.org/b/id/7975723-L.jpg'],
        stock: 3,
        rating: 4.5,
        reviewCount: 345,
    },
    {
        title: 'The Pragmatic Programmer',
        author: 'David Thomas & Andrew Hunt',
        year: 1999,
        price: 549,
        condition: 'Excellent',
        category: 'Technology',
        description: 'Your journey to mastery. Essential reading for any developer who wants to become a better programmer.',
        images: ['https://covers.openlibrary.org/b/id/12064190-L.jpg'],
        stock: 2,
        rating: 4.6,
        reviewCount: 278,
    },

    // ── Children's Books ─────────────────────────────────────────────────────
    {
        title: 'Harry Potter and the Philosopher\'s Stone',
        author: 'J.K. Rowling',
        year: 1997,
        price: 299,
        condition: 'Good',
        category: 'Children',
        description: 'The boy who lived! Harry Potter discovers he\'s a wizard on his 11th birthday and enters the magical world of Hogwarts.',
        images: ['https://covers.openlibrary.org/b/id/12763031-L.jpg'],
        stock: 7,
        rating: 4.9,
        reviewCount: 892,
    },
    {
        title: 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe',
        author: 'C.S. Lewis',
        year: 1950,
        price: 199,
        condition: 'Very Good',
        category: 'Children',
        description: 'Four children discover a magical land through a wardrobe and embark on an epic adventure to defeat the White Witch.',
        images: ['https://covers.openlibrary.org/b/id/12439164-L.jpg'],
        stock: 4,
        rating: 4.7,
        reviewCount: 567,
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
        } else {
            console.log('📦  Seed seller already exists: seller@bookhaven.com / Seller@123');
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
        } else {
            console.log('👤  Seed customer already exists: customer@bookhaven.com / Customer@123');
        }

        // Remove old seeded books and re-seed
        await Book.deleteMany({ seller: seller._id });

        const books = await Book.insertMany(
            sampleBooks.map(b => ({ ...b, seller: seller._id }))
        );

        console.log(`📚  Seeded ${books.length} books across ${new Set(sampleBooks.map(b => b.category)).size} categories`);
        console.log('\n✨  Seed complete!\n');
        console.log('Demo accounts:');
        console.log('  Customer: customer@bookhaven.com / Customer@123');
        console.log('  Seller:   seller@bookhaven.com / Seller@123');
        console.log('  Admin:    admin@bookhaven.com / Admin@123 (run seedAdmin.js first)');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err.message);
        process.exit(1);
    }
};

seed();
