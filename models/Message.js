import mongoose from 'mongoose';

const messageSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    reply: { type: String, default: '' }, // للإصدارات القديمة
    repliedAt: { type: Date },
    isRead: {
      type: Boolean,
      default: false,
    },
    isReplied: { type: Boolean, default: false },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // ✅ جديد: مصفوفة الردود (محادثة مترابطة)
    replies: [
      {
        message: { type: String, required: true },
        sender: { type: String, enum: ['user', 'admin'], required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;