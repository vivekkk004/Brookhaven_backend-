import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envFile =
    process.env.NODE_ENV === 'production'
        ? '.env.production'
        : process.env.NODE_ENV === 'test'
            ? '.env.test'
            : '.env.development';

dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

if (process.env.NODE_ENV === 'production') {
    const required = ['MONGO_URI_PROD', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'APP_BASE_URL'];
    const missing = required.filter(name => !process.env[name]);
    for (const secretName of ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'ADMIN_PASSWORD']) {
        if (process.env[secretName] && process.env[secretName].length < 32) missing.push(`${secretName} (minimum 32 characters)`);
    }
    if (missing.length) {
        throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
    }
}

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

};

export default env;
