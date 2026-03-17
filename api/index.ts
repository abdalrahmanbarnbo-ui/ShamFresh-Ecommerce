import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

// ==========================================
// إعدادات Cloudinary لرفع الصور
// ==========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('يُسمح برفع الصور فقط'));
  }
});

const uploadToCloudinary = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sham_fresh_uploads' },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

const deleteCloudinaryImage = async (imageUrl: string | null) => {
  if (imageUrl && imageUrl.includes('cloudinary.com')) {
    try {
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicId = filename.split('.')[0];
      await cloudinary.uploader.destroy(`sham_fresh_uploads/${publicId}`);
    } catch (err) {
      console.error('خطأ في حذف الصورة السحابية:', err);
    }
  }
};

// ==========================================
// Middleware الصلاحيات
// ==========================================
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  const user = await prisma.user.findFirst({
    where: { token: token },
    select: { id: true, name: true, phone: true, role: true }
  });

  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  
  (req as any).user = user;
  next();
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

const requireMasterKey = (req: any, res: any, next: any) => {
  const masterKey = req.headers['x-master-key'];
  if (masterKey !== (process.env.MASTER_KEY || 'sham2026')) {
    return res.status(401).json({ error: 'غير مصرح لك بالوصول' });
  }
  next();
};

// ==========================================
// مسارات المصادقة (Auth Routes)
// ==========================================
app.post('/api/auth/signup', async (req, res) => {
  const { name, phone, password, role, activation_code } = req.body;
  try {
    if (role === 'admin') {
      if (!activation_code) return res.status(400).json({ error: 'كود التفعيل مطلوب لحسابات المتاجر' });
      const codeRecord = await prisma.activationCode.findFirst({
        where: { code: activation_code, used: 0 }
      });
      if (!codeRecord) return res.status(400).json({ error: 'كود التفعيل غير صالح أو مستخدم مسبقاً' });
      await prisma.activationCode.update({
        where: { id: codeRecord.id },
        data: { used: 1 }
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone: phone } });
    if (existingUser) return res.status(400).json({ error: 'رقم الهاتف مستخدم مسبقاً' });

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const token = crypto.randomBytes(32).toString('hex');
    
    const newUser = await prisma.user.create({
      data: {
        name, phone, password: hashedPassword, token,
        role: role === 'admin' ? 'admin' : 'customer'
      }
    });
    
    res.json({ success: true, user: { id: newUser.id, name: newUser.name, phone: newUser.phone, role: newUser.role }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء التسجيل' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const user = await prisma.user.findFirst({
      where: { phone: phone, password: hashedPassword }
    });
    
    if (!user) return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });

    const token = crypto.randomBytes(32).toString('hex');
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { token: token }
    });
    
    res.json({ success: true, user: { id: updatedUser.id, name: updatedUser.name, phone: updatedUser.phone, role: updatedUser.role }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: (req as any).user.id },
    select: { id: true, name: true, phone: true, role: true, store_image: true, address: true, lat: true, lng: true }
  });
  res.json({ user });
});

app.put('/api/auth/store-image', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    let imageUrl = req.body.store_image || null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }
    await prisma.user.update({
      where: { id: userId },
      data: { store_image: imageUrl }
    });
    res.json({ success: true, imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الصورة' });
  }
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: (req as any).user.id },
    data: { token: null }
  });
  res.json({ success: true });
});

// ==========================================
// مسارات النظام المتقدمة
// ==========================================
app.get('/api/system/activation-codes', requireMasterKey, async (req, res) => {
  const codes = await prisma.activationCode.findMany({ orderBy: { created_at: 'desc' } });
  res.json(codes);
});

app.post('/api/system/activation-codes', requireMasterKey, async (req, res) => {
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  await prisma.activationCode.create({ data: { code } });
  res.json({ success: true, code });
});

app.get('/api/restaurants', async (req, res) => {
  const restaurants = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, name: true, store_image: true }
  });
  res.json(restaurants);
});

app.get('/api/restaurants/:id/products', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { seller_id: Number(req.params.id) },
    include: { category: true }
  });
  const formattedProducts = products.map(p => ({ ...p, category_name: p.category?.name }));
  res.json(formattedProducts);
});

app.get('/api/admin/products', requireAuth, requireAdmin, async (req, res) => {
  const seller_id = (req as any).user.id;
  const products = await prisma.product.findMany({
    where: { seller_id },
    include: { category: true }
  });
  const formattedProducts = products.map(p => ({ ...p, category_name: p.category?.name }));
  res.json(formattedProducts);
});

app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true }
  });
  const formattedProducts = products.map(p => ({ ...p, category_name: p.category?.name }));
  res.json(formattedProducts);
});

app.get('/api/categories', async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});

app.post('/api/products', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { category_id, name, description, price, unit, stock } = req.body;
    const seller_id = (req as any).user.id;
    let imageUrl = req.body.image || null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }
    const product = await prisma.product.create({
      data: { 
        category_id: Number(category_id) || 1, 
        name: name || 'منتج بدون اسم', 
        description: description || '', 
        price: Number(price) || 0, 
        unit: unit || 'piece', 
        stock: Number(stock) || 0, 
        image: imageUrl, 
        seller_id 
      }
    });
    res.json({ success: true, id: product.id, product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المنتج' });
  }
});

app.put('/api/products/:id', requireAuth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const seller_id = (req as any).user.id;
    const { category_id, name, description, price, unit, stock } = req.body;
    const oldProduct = await prisma.product.findFirst({
      where: { id: productId, seller_id }
    });
    if (!oldProduct) return res.status(404).json({ error: 'المنتج غير موجود' });

    let newImageUrl = req.body.image !== undefined ? req.body.image : oldProduct.image;
    if (req.file) {
      newImageUrl = await uploadToCloudinary(req.file.buffer);
      await deleteCloudinaryImage(oldProduct.image);
    }

    await prisma.product.update({
      where: { id: productId },
      data: { 
        category_id: Number(category_id) || 1, 
        name: name || oldProduct.name, 
        description: description !== undefined ? description : oldProduct.description, 
        price: price !== undefined ? Number(price) : oldProduct.price, 
        unit: unit || oldProduct.unit, 
        stock: stock !== undefined ? Number(stock) : oldProduct.stock, 
        image: newImageUrl 
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل المنتج' });
  }
});

app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const seller_id = (req as any).user.id;
    const product = await prisma.product.findFirst({
      where: { id: productId, seller_id }
    });
    if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });

    await deleteCloudinaryImage(product.image);
    await prisma.product.delete({
      where: { id: productId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف المنتج' });
  }
});

app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role === 'admin') return res.status(403).json({ error: 'حسابات المتاجر لا يمكنها إجراء طلبات' });

    const { items, total_amount, payment_method, payment_reference, lat, lng, address, seller_id } = req.body;
    if (address) {
      await prisma.user.update({
        where: { id: user.id },
        data: { address, lat: lat != null ? Number(lat) : null, lng: lng != null ? Number(lng) : null }
      });
    }

    let parsedItems = items || [];
    if (typeof items === 'string') {
      try { parsedItems = JSON.parse(items); } catch (e) { parsedItems = []; }
    }

    const order = await prisma.order.create({
      data: {
        user_id: user.id, 
        total_amount: Number(total_amount) || 0, 
        payment_method: payment_method || 'cod', 
        payment_reference, 
        delivery_lat: lat != null ? Number(lat) : null, 
        delivery_lng: lng != null ? Number(lng) : null, 
        delivery_address: address, 
        seller_id: seller_id != null ? Number(seller_id) : null,
        items: {
          create: parsedItems.map((item: any) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
            price_at_time: Number(item.price)
          }))
        }
      }
    });
    res.json({ success: true, orderId: order.id });
  } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'حدث خطأ أثناء إتمام الطلب' });
  }
});

app.get('/api/orders', requireAuth, requireAdmin, async (req, res) => {
  const seller_id = (req as any).user.id;
  const orders = await prisma.order.findMany({
    where: { seller_id },
    orderBy: { created_at: 'desc' },
    include: { user: true, items: { include: { product: true } } }
  });
  const formattedOrders = orders.map(o => ({
    ...o, user_name: o.user.name, user_phone: o.user.phone, user_address: o.delivery_address || o.user.address,
    items: o.items.map(i => ({ ...i, product_name: i.product.name, product_image: i.product.image, unit: i.product.unit }))
  }));
  res.json(formattedOrders);
});

app.get('/api/my-orders', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const orders = await prisma.order.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    include: { seller: true, items: { include: { product: true } } }
  });
  const formattedOrders = orders.map(o => ({
    ...o, seller_name: o.seller?.name,
    items: o.items.map(i => ({ ...i, product_name: i.product.name, product_image: i.product.image, unit: i.product.unit }))
  }));
  res.json(formattedOrders);
});

app.put('/api/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const seller_id = (req as any).user.id;
  await prisma.order.update({
    where: { id: Number(req.params.id), seller_id },
    data: { status }
  });
  res.json({ success: true });
});

app.put('/api/orders/:id/rating', requireAuth, async (req, res) => {
  const { rating, review } = req.body;
  await prisma.order.update({
    where: { id: Number(req.params.id), user_id: (req as any).user.id },
    data: { rating, review }
  });
  res.json({ success: true });
});

// ==========================================
// التصدير لمنصة Vercel (هذا هو السحر الجديد)
// ==========================================
export default app;

// للتشغيل المحلي على جهازك فقط
if (process.env.NODE_ENV !== 'production') {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running locally on http://localhost:${PORT}`);
  });
}