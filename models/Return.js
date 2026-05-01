import mongoose from 'mongoose';

const returnSchema = mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    phone: { type: String, required: true },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'completed'], 
      default: 'pending'
    },
    adminNote: { type: String, default: '' },
    refundAmount: { type: Number, default: 0 },
    refundMethod: { type: String, enum: ['wallet', 'bank', 'cod'], default: 'wallet' },
  },
  { timestamps: true }
);

const Return = mongoose.model('Return', returnSchema);
export default Return;