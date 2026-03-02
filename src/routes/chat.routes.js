import { Router } from 'express';
import { body } from 'express-validator';
import * as chat from '../controllers/chatController.js';
import { verifyToken } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.use(verifyToken);

router.get('/conversations', chat.getConversations);
router.post('/conversations',
    body('userId').notEmpty(),
    validate,
    chat.createConversation
);
router.get('/conversations/:id/messages', chat.getMessages);
router.post('/conversations/:id/messages',
    body('text').notEmpty().withMessage('Message text required'),
    validate,
    chat.sendMessage
);
router.patch('/conversations/:id/read', chat.markAsRead);

export default router;
