import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envFile =
    process.env.NODE_ENV === 'production'
        ? '.env.production'
        : process.env.NODE_ENV === 'test'
            ? '.env.test'
            : '.env';

dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT) || 8000,
    MONGO_URI:
        process.env.NODE_ENV === 'production'
            ? process.env.MONGO_URI_PROD
            : process.env.MONGO_URI_DEV || 'mongodb://127.0.0.1:27017/bookhaven',

    JWT_SECRET: process.env.JWT_SECRET || 'bookhaven_secret_key',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'bookhaven_refresh_secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    FRONTEND_URL: process.env.APP_BASE_URL || 'http://localhost:5173',

    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@bookhaven.com',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@123',

    // Razorpay
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',

    // Email
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
    EMAIL_SECURE: process.env.EMAIL_SMTP_SECURE === 'true',
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
};

export default env;
