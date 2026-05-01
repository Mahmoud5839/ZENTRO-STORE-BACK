import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 *  Middleware: التحقق من أن المستخدم مسجل الدخول
 * - يقرأ التوكن من الـ Authorization header
 * - يتحقق من صحة التوكن
 * - يضيف بيانات المستخدم إلى req.user
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. التحقق من وجود التوكن في الـ headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. استخراج التوكن (إزالة 'Bearer ' من البداية)
      token = req.headers.authorization.split(' ')[1];

      // 3. فك تشفير التوكن والتحقق من صحته
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. البحث عن المستخدم في قاعدة البيانات وإضافته للـ request
      //    نستخدم .select('-password') لحذف كلمة المرور من البيانات
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          message: 'المستخدم غير موجود، يرجى تسجيل الدخول مرة أخرى'
        });
      }

      // 5. الانتقال إلى الـ middleware التالي أو الـ controller
      next();
    } catch (error) {
      console.error(' Auth Error:', error.message);

      // أنواع مختلفة من أخطاء التوكن
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'توكن غير صالح' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'انتهت صلاحية التوكن، يرجى تسجيل الدخول مرة أخرى' });
      }

      res.status(401).json({ message: 'غير مصرح، فشل التوثيق' });
    }
  }

  // 6. إذا لم يوجد توكن
  if (!token) {
    res.status(401).json({
      message: 'غير مصرح، لا يوجد رمز وصول. يرجى تسجيل الدخول'
    });
  }
};

/**
 *  Middleware: التحقق من أن المستخدم أدمن
 * - يستخدم بعد protect
 * - يتحقق من أن req.user موجود ودوره admin
 */
export const adminOnly = (req, res, next) => {
  // التأكد من وجود req.user (من protect middleware)
  if (!req.user) {
    return res.status(401).json({ message: 'غير مصرح، يرجى تسجيل الدخول' });
  }

  // التحقق من صلاحية الأدمن
  if (req.user && req.user.role === 'admin') {
    next(); //  المستخدم أدمن، كمل
  } else {
    res.status(403).json({
      message: 'ممنوع الوصول، هذه الصفحة للأدمن فقط',
      userRole: req.user.role // للمساعدة في التصحيح
    });
  }
};

/**
 *  Middleware اختياري: التحقق من دور المستخدم (مرن)
 * - يستخدم للتحقق من أدوار متعددة
 * - مثال: allowRoles(['admin', 'manager'])
 */
export const allowRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'غير مصرح، يرجى تسجيل الدخول' });
    }

    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        message: `ممنوع الوصول، يسمح فقط للأدوار: ${roles.join(', ')}`,
        yourRole: req.user.role
      });
    }
  };
};