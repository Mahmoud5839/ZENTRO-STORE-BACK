import Product from '../models/Product.js';


export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'المنتج غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const createProduct = async (req, res) => {
  try {
    const { name, price, costPrice, description, images, image, category, countInStock, orderLink } = req.body;

    const product = new Product({
      name,
      price,
      costPrice: costPrice || 0,
      description,
      images: images || [],
      image: image || (images && images[0]) || '',
      category,
      countInStock,
      orderLink: orderLink || '', // إضافة الحقل الجديد
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateProduct = async (req, res) => {
  try {
    const { name, price, costPrice, description, images, image, category, countInStock, orderLink } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price || product.price; 
      product.costPrice = costPrice !== undefined ? costPrice : product.costPrice;
      product.description = description || product.description;
      product.images = images || product.images;
      product.image = image || (images && images[0]) || product.image;
      product.category = category || product.category;
      product.countInStock = countInStock || product.countInStock;
      product.orderLink = orderLink !== undefined ? orderLink : product.orderLink; // تحديث الحقل

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'المنتج غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'تم حذف المنتج بنجاح' });
    } else {
      res.status(404).json({ message: 'المنتج غير موجود' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};