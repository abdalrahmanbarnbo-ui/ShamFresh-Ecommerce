import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';

const prisma = new PrismaClient();

async function seedInitialData() {
  const count = await prisma.product.count();
  if (count === 0) {
    const cat1 = await prisma.category.create({
      data: { name: 'خضروات وفواكه', image: 'https://picsum.photos/seed/veg/400/300' }
    });
    const cat2 = await prisma.category.create({
      data: { name: 'لحومات', image: 'https://picsum.photos/seed/meat/400/300' }
    });
    
    await prisma.product.createMany({
      data: [
        { category_id: cat1.id, name: 'طماطم طازجة', description: 'طماطم بلدية طازجة للطبخ والسلطات', price: 15000, unit: 'kg', stock: 100, image: 'https://picsum.photos/seed/tomato/400/300' },
        { category_id: cat1.id, name: 'خيار بلدي', description: 'خيار طازج ومقرمش', price: 12000, unit: 'kg', stock: 50, image: 'https://picsum.photos/seed/cucumber/400/300' },
        { category_id: cat2.id, name: 'لحم غنم مفروم', description: 'لحم غنم طازج مفروم ناعم', price: 180000, unit: 'kg', stock: 20, image: 'https://picsum.photos/seed/lamb/400/300' },
        { category_id: cat1.id, name: 'بقدونس', description: 'باقة بقدونس طازجة', price: 2000, unit: 'piece', stock: 200, image: 'https://picsum.photos/seed/parsley/400/300' }
      ]
    });
    console.log("تمت إضافة البيانات الأولية بنجاح.");
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
app.use('/uploads', express.static(uploadDir));
  // إدخال البيانات الأولية إذا كانت قاعدة البيانات فارغة
  await seedInitialData();

  // Auth Middleware
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

  // Auth Routes
  app.post('/api/auth/signup', async (req, res) => {
    const { name, phone, password, role, activation_code } = req.body;
    
    try {
      if (role === 'admin') {
        if (!activation_code) {
          return res.status(400).json({ error: 'كود التفعيل مطلوب لحسابات المتاجر' });
        }
        const codeRecord = await prisma.activationCode.findFirst({
          where: { code: activation_code, used: 0 }
        });
        if (!codeRecord) {
          return res.status(400).json({ error: 'كود التفعيل غير صالح أو مستخدم مسبقاً' });
        }
        // Mark as used
        await prisma.activationCode.update({
          where: { id: codeRecord.id },
          data: { used: 1 }
        });
      }

      const existingUser = await prisma.user.findUnique({ where: { phone: phone } });
      if (existingUser) {
        return res.status(400).json({ error: 'رقم الهاتف مستخدم مسبقاً' });
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const token = crypto.randomBytes(32).toString('hex');
      
      const newUser = await prisma.user.create({
        data: {
          name, phone, password: hashedPassword, token,
          role: role === 'admin' ? 'admin' : 'customer'
        }
      });
      
      res.json({ 
        success: true, 
        user: { id: newUser.id, name: newUser.name, phone: newUser.phone, role: newUser.role },
        token 
      });
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
      
      if (!user) {
        return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
      }

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

  app.put('/api/auth/store-image', requireAuth, requireAdmin, async (req, res) => {
    const { store_image } = req.body;
    await prisma.user.update({
      where: { id: (req as any).user.id },
      data: { store_image }
    });
    res.json({ success: true });
  });

  app.post('/api/auth/logout', requireAuth, async (req, res) => {
    await prisma.user.update({
      where: { id: (req as any).user.id },
      data: { token: null }
    });
    res.json({ success: true });
  });

  // System Admin Routes
  const requireMasterKey = (req: any, res: any, next: any) => {
    const masterKey = req.headers['x-master-key'];
    if (masterKey !== (process.env.MASTER_KEY || 'sham2026')) {
      return res.status(401).json({ error: 'غير مصرح لك بالوصول' });
    }
    next();
  };

  app.get('/api/system/activation-codes', requireMasterKey, async (req, res) => {
    const codes = await prisma.activationCode.findMany({ orderBy: { created_at: 'desc' } });
    res.json(codes);
  });

  app.post('/api/system/activation-codes', requireMasterKey, async (req, res) => {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    await prisma.activationCode.create({ data: { code } });
    res.json({ success: true, code });
  });

  // API Routes
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

  app.post('/api/products', requireAuth, requireAdmin, async (req, res) => {
    const { category_id, name, description, price, unit, stock, image } = req.body;
    const seller_id = (req as any).user.id;
    const product = await prisma.product.create({
      data: { category_id, name, description, price, unit, stock, image, seller_id }
    });
    res.json({ success: true, id: product.id });
  });

  app.put('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
    const { category_id, name, description, price, unit, stock, image } = req.body;
    const seller_id = (req as any).user.id;
    await prisma.product.update({
      where: { id: Number(req.params.id), seller_id }, // Ensure seller owns it
      data: { category_id, name, description, price, unit, stock, image }
    });
    res.json({ success: true });
  });

  app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
    const seller_id = (req as any).user.id;
    await prisma.product.delete({
      where: { id: Number(req.params.id), seller_id }
    });
    res.json({ success: true });
  });

  app.post('/api/orders', requireAuth, async (req, res) => {
    const user = (req as any).user;
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'حسابات البائعين لا يمكنها إجراء طلبات' });
    }

    const { items, total_amount, payment_method, payment_reference, lat, lng, address, seller_id } = req.body;

    if (address) {
      await prisma.user.update({
        where: { id: user.id },
        data: { address, lat, lng }
      });
    }

    // انشاء الطلب ومحتوياته في خطوة واحدة
    const order = await prisma.order.create({
      data: {
        user_id: user.id, total_amount, payment_method, payment_reference, 
        delivery_lat: lat, delivery_lng: lng, delivery_address: address, seller_id,
        items: {
          create: items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_time: item.price
          }))
        }
      }
    });

    res.json({ success: true, orderId: order.id });
  });

  app.get('/api/orders', requireAuth, requireAdmin, async (req, res) => {
    const seller_id = (req as any).user.id;
    const orders = await prisma.order.findMany({
      where: { seller_id },
      orderBy: { created_at: 'desc' },
      include: {
        user: true,
        items: { include: { product: true } }
      }
    });
    
    // تنسيق البيانات لتطابق الواجهة الأمامية القديمة
    const formattedOrders = orders.map(o => ({
      ...o,
      user_name: o.user.name,
      user_phone: o.user.phone,
      user_address: o.delivery_address || o.user.address,
      items: o.items.map(i => ({
        ...i,
        product_name: i.product.name,
        product_image: i.product.image,
        unit: i.product.unit
      }))
    }));
    res.json(formattedOrders);
  });

  app.get('/api/my-orders', requireAuth, async (req, res) => {
    const user = (req as any).user;
    const orders = await prisma.order.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      include: {
        seller: true,
        items: { include: { product: true } }
      }
    });
    
    const formattedOrders = orders.map(o => ({
      ...o,
      seller_name: o.seller?.name,
      items: o.items.map(i => ({
        ...i,
        product_name: i.product.name,
        product_image: i.product.image,
        unit: i.product.unit
      }))
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// إعدادات Multer لحفظ الملفات وتسميتها
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // إعطاء اسم فريد للصورة حتى لا تتداخل الصور بنفس الاسم
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

startServer();