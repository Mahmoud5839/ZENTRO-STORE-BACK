// orderController.js

import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Notification from '../models/Notification.js';

export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'لا توجد منتجات في الطلب' });
    }

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        if (product.countInStock >= item.quantity) {
          product.countInStock -= item.quantity;
          await product.save();
        } else {
          return res.status(400).json({
            message: `الكمية المطلوبة من ${product.name} غير متوفرة`
          });
        }
      }
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        firstName: shippingAddress.firstName,
        lastName: shippingAddress.lastName,
        phone: shippingAddress.phone,
        governorate: shippingAddress.governorate,
        city: shippingAddress.city,
        street: shippingAddress.street,
        building: shippingAddress.building,
        address: shippingAddress.address,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
      },
      paymentMethod: paymentMethod || 'cod',
      totalPrice,
    });

    const createdOrder = await order.save();

    await Notification.create({
      user: null,
      title: ' طلب جديد!',
      message: `طلب جديد رقم ${createdOrder._id.toString().slice(-6)} بقيمة $${totalPrice} من ${shippingAddress.fullName || shippingAddress.firstName + ' ' + shippingAddress.lastName}`,
      type: 'order',
      link: '/admin/dashboard',
      isRead: false,
      forAdmin: true,
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'orderItems.product',
        select: 'name images image price',
      });

    if (order) {
      const formattedOrder = {
        ...order.toObject(),
        orderItems: order.orderItems.map(item => {
          const product = item.product;
          return {
            ...item.toObject(),
            image: product?.images?.[0] || product?.image || item.image || 'https://via.placeholder.com/80',
          };
        }),
      };
      res.json(formattedOrder);
    } else {
      res.status(404).json({ message: 'الطلب غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate({
        path: 'orderItems.product',
        select: 'name images image price',
      })
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map(order => {
      const formattedItems = order.orderItems.map(item => {
        const product = item.product;
        return {
          ...item.toObject(),
          productId: product?._id || item.product,
          image: product?.images?.[0] || product?.image || 'https://via.placeholder.com/60',
          productName: product?.name || item.name,
        };
      });

      return {
        ...order.toObject(),
        orderItems: formattedItems,
      };
    });

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.isCompleted = true;
      order.completedAt = Date.now();
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'الطلب غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};