import mongoose from 'mongoose';
import env from './env.js';

// Indexes that SHOULD exist on the users collection (based on current User schema)
const VALID_USER_INDEXES = new Set(['_id_', 'email_1']);

/**
 * Drop any stale indexes on the users collection that are not part of the
 * current schema. This prevents E11000 duplicate key errors from orphaned
 * unique indexes (e.g., username_1, employeeId_1) left over from old migrations.
 */
const cleanStaleIndexes = async () => {
    try {
        const col = mongoose.connection.collection('users');
        const indexes = await col.indexes();
        for (const idx of indexes) {
            if (!VALID_USER_INDEXES.has(idx.name)) {
                await col.dropIndex(idx.name);
                console.log(`🧹  Dropped stale index: ${idx.name}`);
            }
        }
    } catch (err) {
        // Non-fatal — log and continue
        console.warn('⚠️  Could not clean stale indexes:', err.message);
    }
};

const connectDB = async (retries = 5) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);

            // Clean up stale indexes from previous schema versions
            await cleanStaleIndexes();

            return;
        } catch (err) {
            console.error(`❌  MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
            if (attempt === retries) {
                console.error('MongoDB connection failed after all retries. Exiting.');
                process.exit(1);
            }
            await new Promise(r => setTimeout(r, 3000));
        }
    }
};

export default connectDB;
