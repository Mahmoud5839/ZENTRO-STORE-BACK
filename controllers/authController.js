
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';



//  إعداد Gmail بشكل صحيح مع nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    //   إنشاء رمز تأكيد عشوائي
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpire: Date.now() + 30 * 60 * 1000, // 30 دقيقة
    });

    //  لا نرسل إيميل هنا، فقط ننشئ الحساب
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول لتأكيد بريدك الإلكتروني',
      requiresVerification: true,
      email: user.email,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {

      //  التحقق من تأكيد البريد الإلكتروني
      if (!user.isEmailVerified) {
        return res.status(401).json({
          message: 'يرجى تأكيد بريدك الإلكتروني أولاً. تم إرسال رابط التأكيد إلى بريدك',
          requiresVerification: true,
          email: user.email,
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'بريد إلكتروني أو كلمة مرور غير صحيحة' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // إنشاء مستخدم جديد إذا لم يكن موجوداً
      user = await User.create({
        name: name,
        email: email,
        password: Math.random().toString(36).slice(-16), // كلمة مرور عشوائية
        role: 'user',
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'فشل مصادقة Google' });
  }
};



// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     console.log("📧 Forgot password request for:", email);

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: 'لا يوجد مستخدم بهذا البريد الإلكتروني' });
//     }

//     // إنشاء رمز عشوائي
//     const resetToken = crypto.randomBytes(32).toString('hex');
//     console.log("🔑 Reset token generated:", resetToken);

//     // تحديث المستخدم بالرمز
//     await User.updateOne(
//       { _id: user._id },
//       {
//         $set: {
//           resetPasswordToken: resetToken,
//           resetPasswordExpire: Date.now() + 30 * 60 * 1000,
//         },
//       }
//     );

//     console.log("💾 User updated with token");

//     // رابط إعادة التعيين
//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
//     console.log("🔗 Reset URL:", resetUrl);

//     //  إرسال الإيميل
//     const mailOptions = {
//       from: `"متجر ألماسة" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: 'إعادة تعيين كلمة المرور - متجر ألماسة',
//       html: `
//         <div dir="rtl" style="font-family: 'Cairo', sans-serif; padding: 20px;">
//           <h2 style="color: #2563eb;"> إعادة تعيين كلمة المرور</h2>
//           <p>مرحباً ${user.name}،</p>
//           <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك في متجر ألماسة.</p>
//           <p>اضغط على الرابط أدناه لإكمال العملية:</p>
//           <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">إعادة تعيين كلمة المرور</a>
//           <p> هذا الرابط صالح لمدة 30 دقيقة فقط.</p>
//           <p>إذا لم تطلب إعادة التعيين، يرجى تجاهل هذا الإيميل.</p>
//           <hr />
//           <p style="color: #6b7280; font-size: 12px;">متجر ألماسة - جميع الحقوق محفوظة</p>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log("  Email sent successfully");

//     res.json({ message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' });

//   } catch (error) {
//     console.error("❌ Error in forgotPassword:", error);
//     res.status(500).json({ message: error.message });
//   }
// };


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'لا يوجد مستخدم بهذا البريد الإلكتروني' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpire: Date.now() + 30 * 60 * 1000,
        },
      }
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    //   فقط يطبع الرابط في Terminal للتجربة المحلية
    console.log('\n========================================');
    console.log(' رابط إعادة تعيين كلمة المرور:');
    console.log(resetUrl);
    console.log(' صالح لمدة 30 دقيقة');
    console.log('========================================\n');

    //   العميل يرى نجاح (دون خطأ)
    res.json({
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني (في التطوير، تحقق من الطرفية)'
    });

  } catch (error) {
    console.error('❌ Error in forgotPassword:', error);
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'رابط غير صالح أو منتهي الصلاحية' });
    }

    // تحديث كلمة المرور
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message });
  }
};


export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'رابط التأكيد غير صالح أو منتهي الصلاحية' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpire = null;
    await user.save();

    res.json({
      success: true,
      message: 'تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول',
      redirect: '/login',
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'البريد الإلكتروني مطلوب' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'البريد الإلكتروني مؤكد بالفعل' });
    }

    // إنشاء رمز تأكيد جديد
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpire = Date.now() + 30 * 60 * 1000; // 30 دقيقة
    await user.save();

    // رابط تأكيد البريد الإلكتروني
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // إعداد البريد الإلكتروني
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // إرسال إيميل التأكيد
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: ' تأكيد البريد الإلكتروني - ZENTRO-STORE ',
      html: `
        <div dir="rtl" style="font-family: 'Cairo', sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;"> تأكيد البريد الإلكتروني</h2>
          <p>مرحباً ${user.name}،</p>
          <p>لقد تلقينا طلباً لإعادة إرسال رابط تأكيد بريدك الإلكتروني. يرجى تأكيد بريدك بالضغط على الرابط أدناه:</p>
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">تأكيد البريد الإلكتروني</a>
          <p>هذا الرابط صالح لمدة  30 دقيقة فقط.</p>
          <p>إذا لم تقم بطلب إعادة الإرسال، يرجى تجاهل هذا الإيميل.</p>
          <hr />
          <p style="color: #6b7280; font-size: 12px;"> ZENTRO-STORE - جميع الحقوق محفوظة</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني'
    });

  } catch (error) {
    console.error('Error in resendVerification:', error);
    res.status(500).json({ message: error.message });
  }
};

