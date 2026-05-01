import express from 'express';
import {
    registerUser,
    loginUser,
    googleAuth,
    getUserProfile,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser); 
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/profile', protect, getUserProfile);

export default router;