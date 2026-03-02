/**
 * Seed script to create an initial admin user or upgrade an existing user to admin.
 * Run: node src/scripts/seedAdmin.js
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
    const password = 'Admin@123';

    let admin = await User.findOne({ email });

    if (admin) {
        admin.role = 'admin';
        await admin.save();
        console.log(`✅ Existing user ${email} updated to Admin role.`);
    } else {
        // Create new admin
        admin = new User({
            name: 'System Admin',
            email,
            password, // Mongoose schema pre-save hook will hash this
            role: 'admin',
        });
        await admin.save();
        console.log(`✅ New Admin user created:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
