import { Router } from 'express';
import { body } from 'express-validator';
import * as books from '../controllers/booksController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import validate from '../middleware/validate.js';

const router = Router();

// Public
router.get('/', books.getBooks);
router.get('/:id', books.getBookById);

// Seller only
router.get('/my/listings', verifyToken, requireRole('user'), books.getMyBooks);

router.post('/', verifyToken, requireRole('user'),
    upload.array('images', 5),
    body('title').notEmpty(),
    body('author').notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('condition').isIn(['Fair', 'Good', 'Very Good', 'Excellent']),
    body('category').notEmpty(),
    validate,
    books.createBook
);

router.put('/:id', verifyToken, requireRole('user'),
    upload.array('images', 5),
    books.updateBook
);

router.delete('/:id', verifyToken, requireRole('user'), books.deleteBook);

export default router;
