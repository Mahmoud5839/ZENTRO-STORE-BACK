import express from 'express';
import {
    getAdminNotifications,
    getMyNotifications,
    markNotificationAsRead,
    markAllAsRead,
} from '../controllers/notificationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, adminOnly, getAdminNotifications);
router.get('/my', protect, getMyNotifications);
router.put('/:id/read', protect, markNotificationAsRead);
router.put('/read/all', protect, markAllAsRead);


export default router;