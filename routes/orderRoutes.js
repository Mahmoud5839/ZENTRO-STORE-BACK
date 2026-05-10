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

router.post('/', protect, createOrder);           
router.get('/myorders', protect, getMyOrders);    
router.get('/:id', protect, getOrderById);        

router.get('/', protect, adminOnly, getAllOrders);          
router.put('/:id/complete', protect, adminOnly, completeOrder); 

export default router;