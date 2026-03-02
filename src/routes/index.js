import { Router } from 'express';
import authRoutes from './auth.routes.js';
import booksRoutes from './books.routes.js';
import ordersRoutes from './orders.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import reviewsRoutes from './reviews.routes.js';
import chatRoutes from './chat.routes.js';
import customerRoutes from './customer.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/books', booksRoutes);
router.use('/orders', ordersRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/chat', chatRoutes);
router.use('/customer', customerRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

export default router;
