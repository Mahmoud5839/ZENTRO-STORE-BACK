import Notification from '../models/Notification.js';

export const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ forAdmin: true })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      forAdmin: true,
      isRead: false
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id });

    if (notification) {
      notification.isRead = true;
      await notification.save();
      res.json({ message: 'تم تحديث الإشعار' });
    } else {
      res.status(404).json({ message: 'الإشعار غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { forAdmin: true, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'تم تحديث جميع الإشعارات' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
      forAdmin: false
    }).sort({ createdAt: -1 }).limit(50);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error in getMyNotifications:", error);
    res.status(500).json({ message: error.message });
  }
};