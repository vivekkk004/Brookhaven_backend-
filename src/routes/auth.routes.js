import { Router } from 'express';
import { body } from 'express-validator';
import * as auth from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter,
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').optional().isIn(['customer', 'user']),
    validate,
    auth.register
);

router.post('/login', authLimiter,
    body('email').isEmail(),
    body('password').notEmpty(),
    validate,
    auth.login
);

router.post('/logout', verifyToken, auth.logout);
router.post('/refresh', auth.refresh);
router.get('/me', verifyToken, auth.me);

export default router;
