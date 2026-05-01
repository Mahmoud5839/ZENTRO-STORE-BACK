import express from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  completeOrder,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

//  المستخدم العادي
router.post('/', protect, createOrder);           // إنشاء طلب
router.get('/myorders', protect, getMyOrders);    // طلباتي
router.get('/:id', protect, getOrderById);        // عرض طلب محدد

//  الأدمن فقط
router.get('/', protect, adminOnly, getAllOrders);           // كل الطلبات
router.put('/:id/complete', protect, adminOnly, completeOrder); // تحديث حالة التوصيل

export default router;