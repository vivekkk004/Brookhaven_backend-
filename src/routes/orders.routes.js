import { Router } from 'express';
import { body } from 'express-validator';
import * as orders from '../controllers/ordersController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

// Customer
router.post('/', verifyToken, requireRole('customer'),
    body('bookId').notEmpty(),
    body('shippingAddress').notEmpty(),
    validate,
    orders.placeOrder
);

router.get('/customer', verifyToken, requireRole('customer'), orders.getCustomerOrders);
router.patch('/:id/cancel', verifyToken, requireRole('customer'), orders.cancelOrder);

// Seller
router.get('/seller', verifyToken, requireRole('user'), orders.getSellerOrders);
router.patch('/:id/accept', verifyToken, requireRole('user'), orders.acceptOrder);
router.patch('/:id/reject', verifyToken, requireRole('user'), orders.rejectOrder);
router.patch('/:id/status', verifyToken, requireRole('user'),
    body('status').isIn(['shipped', 'completed']),
    validate,
    orders.updateOrderStatus
);

// Common — must come after specific routes
router.get('/:id', verifyToken, orders.getOrderById);

export default router;
