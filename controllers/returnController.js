import Return from '../models/Return.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';

export const createReturnRequest = async (req, res) => {
  try {
    const { order, product, quantity, reason, phone } = req.body;
    
    console.log("📦 Received return request:", { order, product, quantity, reason, phone });
    
    if (!order) {
      return res.status(400).json({ message: 'رقم الطلب مطلوب' });
    }
    if (!product) {
      return res.status(400).json({ message: 'المنتج مطلوب' });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'الكمية المطلوبة غير صالحة' });
    }
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'سبب الاسترجاع مطلوب' });
    }
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ message: 'رقم الهاتف مطلوب للتواصل' });
    }
    
    // التحقق من وجود الطلب والمنتج في قاعدة البيانات
    const existingOrder = await Order.findById(order);
    if (!existingOrder) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }
    
    const existingProduct = await Product.findById(product);
    if (!existingProduct) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }
    
    const returnRequest = await Return.create({
      order,
      user: req.user._id,
      product,
      quantity,
      reason,
      phone,
      status: 'pending',
    });
    
    console.log("  Return request created:", returnRequest._id);
    
    try {
      await Notification.create({
        user: null,
        title: ' طلب استرجاع جديد',
        message: `طلب استرجاع جديد من ${req.user.name} - هاتف: ${phone}`,
        type: 'return',
        link: `/admin/returns`,
        isRead: false,
        forAdmin: true,
      });
      console.log("  Notification sent to admin");
    } catch (notifError) {
      console.error("⚠️ Notification error:", notifError.message);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'تم إرسال طلب الاسترجاع بنجاح', 
      data: returnRequest 
    });
    
  } catch (error) {
    console.error('❌ Error in createReturnRequest:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ user: req.user._id })
      .populate('order product')
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate('user order product')
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateReturnStatus = async (req, res) => {
  try {
    const { status, adminNote, refundAmount } = req.body;
    const returnRequest = await Return.findById(req.params.id)
      .populate('user product order');

    if (!returnRequest) {
      return res.status(404).json({ message: 'طلب الاسترجاع غير موجود' });
    }

    const oldStatus = returnRequest.status;

    returnRequest.status = status;
    if (adminNote !== undefined) returnRequest.adminNote = adminNote;
    if (refundAmount !== undefined) returnRequest.refundAmount = parseFloat(refundAmount);
    await returnRequest.save();

    if (oldStatus === 'pending' && status === 'approved') {
      try {
        const product = await Product.findById(returnRequest.product._id);
        if (product) {
          product.countInStock += returnRequest.quantity;
          await product.save();
          console.log(`  تم إعادة ${returnRequest.quantity} من ${product.name} إلى المخزون`);
        }
      } catch (err) {
        console.error('❌ خطأ في إعادة المنتج للمخزون:', err);
      }
    }

    try {
      let notificationTitle = '';
      let notificationMessage = '';

      if (status === 'approved') {
        notificationTitle = ' تم قبول طلب الاسترجاع';
        notificationMessage = `تم قبول طلب استرجاع المنتج: ${returnRequest.product?.name}`;
      } else if (status === 'rejected') {
        notificationTitle = ' تم رفض طلب الاسترجاع';
        notificationMessage = `تم رفض طلب استرجاع المنتج: ${returnRequest.product?.name}`;
      } else if (status === 'completed') {
        notificationTitle = ' تم اكتمال الاسترجاع';
        notificationMessage = `تم اكتمال استرجاع المنتج: ${returnRequest.product?.name}`;
      }

      if (notificationTitle) {
        await Notification.create({
          user: returnRequest.user._id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'return',
          link: '/my-returns',
          isRead: false,
          forAdmin: false,
        });
        console.log('  تم إرسال إشعار للعميل');
      }
    } catch (err) {
      console.error('❌ خطأ في إرسال الإشعار:', err);
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة طلب الاسترجاع',
      data: returnRequest
    });

  } catch (error) {
    console.error('❌ خطأ في updateReturnStatus:', error);
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};