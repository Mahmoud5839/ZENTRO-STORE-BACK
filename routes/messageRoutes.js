import express from 'express';
import {
    sendMessage,
    getMessages,
    markAsRead,
    replyToMessage,
    getUserMessages,
    userReply  
} from '../controllers/messageController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', sendMessage);
router.get('/my-messages', protect, getUserMessages);

router.get('/', protect, adminOnly, getMessages);
router.put('/:id/read', protect, adminOnly, markAsRead);
router.put('/:id/reply', protect, adminOnly, replyToMessage);

router.post('/:id/reply-by-user', protect, userReply);

export default router;