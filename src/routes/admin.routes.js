import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import {
    getDashboardStats,
    getAllUsers,
    toggleUserStatus,
    deleteUser,
    getAllAdminBooks,
    deleteAdminBook,
    getAllAdminOrders,
} from '../controllers/admin.controller.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(verifyToken, requireRole('admin'));

// Dashboard
router.get('/stats', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Books
router.get('/books', getAllAdminBooks);
router.delete('/books/:id', deleteAdminBook);

// Orders
router.get('/orders', getAllAdminOrders);

export default router;
