import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();
connectDB();

const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'hooda7113@gmail.com' });
    if (adminExists) {
      console.log('الأدمن موجود بالفعل');
      process.exit();
    }

    const admin = await User.create({
      name: 'AbuRabeh',
      email: 'hooda7113@gmail.com',
      password: '390155522',
      role: 'admin',
    });

    console.log(` تم إنشاء الأدمن: ${admin.email}`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();