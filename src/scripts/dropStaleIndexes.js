/**
 * Drop all stale indexes from users collection that are not in the current schema.
 * Run: node src/scripts/dropStaleIndexes.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI_DEV || 'mongodb://127.0.0.1:27017/bookhaven';

// Indexes that SHOULD exist based on current User schema
const VALID_INDEXES = ['_id_', 'email_1'];

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    const collection = mongoose.connection.collection('users');
    const indexes = await collection.indexes();

    console.log('\nCurrent indexes on users collection:');
    indexes.forEach(idx => console.log(' -', idx.name, '→', JSON.stringify(idx.key)));

    const staleIndexes = indexes.filter(idx => !VALID_INDEXES.includes(idx.name));

    if (staleIndexes.length === 0) {
        console.log('\n✅ No stale indexes found.');
    } else {
        console.log(`\nFound ${staleIndexes.length} stale index(es) to drop:`);
        for (const idx of staleIndexes) {
            try {
                await collection.dropIndex(idx.name);
                console.log(` ✅ Dropped: ${idx.name}`);
            } catch (e) {
                console.log(` ⚠️  Could not drop ${idx.name}: ${e.message}`);
            }
        }
    }

    await mongoose.disconnect();
    console.log('\nDone. Restart your backend server now.');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
