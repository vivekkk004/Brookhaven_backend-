import { Router } from 'express';
import { body } from 'express-validator';
import * as reviews from '../controllers/reviewsController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.get('/book/:bookId', reviews.getBookReviews);

router.post('/book/:bookId', verifyToken, requireRole('customer'),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: 1000 }),
    validate,
    reviews.addReview
);

router.put('/:id', verifyToken, requireRole('customer'),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    validate,
    reviews.updateReview
);

router.delete('/:id', verifyToken, requireRole('customer'), reviews.deleteReview);

export default router;
