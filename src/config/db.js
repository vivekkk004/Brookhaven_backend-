import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async (retries = 5) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
            });
            console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);

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
