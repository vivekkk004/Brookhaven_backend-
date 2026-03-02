import { Router } from 'express';
import * as customer from '../controllers/customerController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

router.use(verifyToken, requireRole('customer'));

router.get('/profile', customer.getProfile);
router.put('/profile', upload.single('avatar'), customer.updateProfile);
router.get('/dashboard', customer.getDashboard);

export default router;
