import express from 'express';
import {
  createReturnRequest,
  getMyReturns,
  getAllReturns,
  updateReturnStatus,
} from '../controllers/returnController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReturnRequest);
router.get('/my-returns', protect, getMyReturns);
router.get('/', protect, adminOnly, getAllReturns);
router.put('/:id/status', protect, adminOnly, updateReturnStatus);

export default router;