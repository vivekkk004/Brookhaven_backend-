import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import env from './config/env.js';
import connectDB from './config/db.js';
import { setupSwagger } from './config/swagger.js';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { sendError } from './utils/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ─── Connect Database ─────────────────────────────────────────────────────────
await connectDB();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Static Files (uploaded book images) ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
setupSwagger(app);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'BookHaven API is running',
        env: env.NODE_ENV,
        time: new Date().toISOString(),
    });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    sendError(res, 'Route not found', 404);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';
    sendError(res, message, status);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
    console.log(`🚀  BookHaven API listening on http://localhost:${env.PORT}`);
    console.log(`📌  Environment: ${env.NODE_ENV}`);
});

export default app;
