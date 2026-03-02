/**
 * One-time script to drop the stale 'username_1' index from the users collection.
 * Run: node src/scripts/dropUsernameIndex.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI_DEV || 'mongodb://127.0.0.1:27017/bookhaven';

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const indexes = await mongoose.connection.collection('users').indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    try {
        await mongoose.connection.collection('users').dropIndex('username_1');
        console.log('✅ Dropped stale username_1 index');
    } catch (e) {
        console.log('Index not found or already dropped:', e.message);
    }

    await mongoose.disconnect();
    console.log('Done');
}

main().catch(console.error);
