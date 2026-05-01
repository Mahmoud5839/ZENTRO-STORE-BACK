import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    costPrice: { type: Number, required: true, default: 0 },
    description: { type: String, required: true },
    images: [{ type: String, required: true }],
    image: { type: String },
    category: { type: String, required: true },
    countInStock: { type: Number, required: true, default: 0 },
    orderLink: { type: String, default: '' },
  },
  { timestamps: true }
);

// حساب الربح المتوقع لكل منتج
productSchema.virtual('expectedProfit').get(function () {
  return (this.price - this.costPrice) * this.countInStock;
});

// حساب هامش الربح
productSchema.virtual('profitMargin').get(function () {
  if (this.costPrice === 0) return 0;
  return ((this.price - this.costPrice) / this.costPrice) * 100;
});

const Product = mongoose.model('Product', productSchema);
export default Product;