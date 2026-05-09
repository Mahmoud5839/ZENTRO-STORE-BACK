// MessageController.js

import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const sendMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    let user = await User.findOne({ email });
    const userId = user?._id || null;

    const newMessage = await Message.create({
      name,
      email,
      subject,
      message,
      user: userId,
    });

    // ✅ إشعار للأدمن بوجود رسالة جديدة
    await Notification.create({
      user: null,
      title: ' رسالة جديدة من عميل',
      message: `رسالة جديدة من ${name}: ${subject.substring(0, 50)}`,
      type: 'message',
      link: '/admin/messages',
      isRead: false,
      forAdmin: true,
    });

    res.status(201).json({ message: 'تم إرسال رسالتك بنجاح', data: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ رد الأدمن على التذكرة
export const replyToMessage = async (req, res) => {
  try {
    const { reply } = req.body;
    const ticket = await Message.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'الرسالة غير موجودة' });
    }

    // إضافة الرد إلى مصفوفة الردود
    ticket.replies.push({
      message: reply,
      sender: 'admin',
      createdAt: new Date(),
    });
    ticket.isReplied = true;
    ticket.repliedAt = Date.now();
    await ticket.save();

    // ✅ إشعار للعميل برد الأدمن
    if (ticket.user) {
      try {
        await Notification.create({
          user: ticket.user,
          title: ' رد على رسالتك',
          message: `تم الرد على رسالتك: ${ticket.subject.substring(0, 50)}`,
          type: 'reply',
          link: '/my-messages',
          isRead: false,
          forAdmin: false,
        });
        console.log("✅ تم إنشاء إشعار للعميل:", ticket.user);
      } catch (err) {
        console.error("❌ فشل إنشاء إشعار للعميل:", err);
      }
    }

    res.status(200).json({ success: true, message: 'تم إرسال الرد', data: ticket });
  } catch (error) {
    console.error("❌ خطأ في replyToMessage:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ رد العميل على نفس التذكرة (جديد)
export const userReply = async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Message.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'التذكرة غير موجودة' });
    }

    if (ticket.user?.toString() !== req.user._id.toString() && ticket.email !== req.user.email) {
      return res.status(403).json({ message: 'غير مصرح لك بالرد على هذه التذكرة' });
    }

    // إضافة رد العميل إلى مصفوفة الردود
    ticket.replies.push({
      message: message,
      sender: 'user',
      createdAt: new Date(),
    });
    ticket.isReplied = true;
    await ticket.save();

    await Notification.create({
      user: null,
      title: ' رد جديد من عميل',
      message: `رد جديد من ${req.user.name} على تذكرة: ${ticket.subject.substring(0, 50)}`,
      type: 'reply',
      link: `/admin/messages`,
      isRead: false,
      forAdmin: true,
    });

    res.status(200).json({ success: true, message: 'تم إرسال ردك', data: ticket });
  } catch (error) {
    console.error("❌ خطأ في userReply:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { user: req.user._id },
        { email: req.user.email }
      ]
    }).sort({ createdAt: -1 });

    const formattedMessages = messages.map(msg => ({
      ...msg.toObject(),
      isReplied: msg.replies && msg.replies.length > 0,
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error in getUserMessages:', error);
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'الرسالة غير موجودة' });
    }

    message.isRead = true;
    await message.save();

    res.status(200).json({ message: 'تم تحديث حالة الرسالة' });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({ message: error.message });
  }
};