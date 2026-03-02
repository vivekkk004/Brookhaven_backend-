import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI_DEV || 'mongodb://127.0.0.1:27017/bookhaven';

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    const email = 'admin@bookhaven.com';
    let admin = await User.findOne({ email }).select('+password');

    if (admin) {
        console.log(`✅ User exists: ${email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Active: ${admin.isActive}`);
        console.log(`   Has Password: ${!!admin.password}`);
    } else {
        console.log(`❌ User DOES NOT EXIST: ${email}`);
        console.log(`   You need to run: node src/scripts/seedAdmin.js`);
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
