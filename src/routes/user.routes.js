import { Router } from 'express';
import * as user from '../controllers/userController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

router.use(verifyToken, requireRole('user'));

router.get('/profile', user.getProfile);
router.put('/profile', upload.single('avatar'), user.updateProfile);
router.get('/dashboard', user.getDashboard);
router.get('/earnings', user.getEarnings);

export default router;
