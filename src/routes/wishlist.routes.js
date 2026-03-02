import { Router } from 'express';
import * as wishlist from '../controllers/wishlistController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(verifyToken, requireRole('customer'));

router.get('/', wishlist.getWishlist);
router.post('/:bookId', wishlist.addToWishlist);
router.delete('/:bookId', wishlist.removeFromWishlist);
router.delete('/', wishlist.clearWishlist);

export default router;
