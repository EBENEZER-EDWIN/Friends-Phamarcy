import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || 'friends-pharmacy-demo-secret';

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

const createToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  jwtSecret,
  { expiresIn: '8h' }
);

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createToken(user);
  const { passwordHash, ...safeUser } = user;

  return res.json({ token, user: safeUser });
});

app.get('/api/dashboard', requireAuth, async (req, res) => {
  const [products, customers, sales, prescriptions] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.sale.count(),
    prisma.prescription.count()
  ]);

  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lte: 20 } },
    orderBy: { stock: 'asc' },
    take: 5
  });

  const totalRevenue = await prisma.sale.aggregate({
    _sum: { total: true }
  });

  const salesToday = await prisma.sale.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  const salesThisMonth = await prisma.sale.aggregate({
    _sum: { total: true },
    where: {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }
  });

  return res.json({
    stats: {
      products,
      customers,
      sales,
      prescriptions,
      revenue: totalRevenue._sum.total || 0,
      salesToday,
      monthlyRevenue: salesThisMonth._sum.total || 0
    },
    lowStockProducts,
    recentSales: await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, cashier: true }
    })
  });
});

app.get('/api/products', requireAuth, async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return res.json(products);
});

app.post('/api/products', requireAuth, async (req, res) => {
  const { name, category, brand, sku, stock, reorderLevel, cost, price, unit } = req.body;

  if (!name || !category || !price) {
    return res.status(400).json({ message: 'Name, category, and price are required.' });
  }

  const product = await prisma.product.create({
    data: {
      name,
      category,
      brand: brand || 'Generic',
      sku: sku || `SKU-${Date.now()}`,
      stock: Number(stock || 0),
      reorderLevel: Number(reorderLevel || 10),
      cost: Number(cost || 0),
      price: Number(price),
      unit: unit || 'pcs'
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'PRODUCT_CREATED',
      details: `Product ${product.name} created`,
      userId: req.user.id
    }
  });

  return res.status(201).json(product);
});

app.get('/api/customers', requireAuth, async (req, res) => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return res.json(customers);
});

app.post('/api/customers', requireAuth, async (req, res) => {
  const { name, phone, email, address, loyaltyId } = req.body;
  if (!name) return res.status(400).json({ message: 'Customer name is required.' });

  const customer = await prisma.customer.create({
    data: {
      name,
      phone,
      email,
      address,
      loyaltyId: loyaltyId || `LOY-${Date.now()}`
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'CUSTOMER_CREATED',
      details: `Customer ${customer.name} created`,
      userId: req.user.id
    }
  });

  return res.status(201).json(customer);
});

app.get('/api/prescriptions', requireAuth, async (req, res) => {
  const prescriptions = await prisma.prescription.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return res.json(prescriptions);
});

app.post('/api/prescriptions', requireAuth, async (req, res) => {
  const { patientName, doctorName, medication, dosage, quantity, expiryDate, status, notes } = req.body;
  if (!patientName || !doctorName || !medication) {
    return res.status(400).json({ message: 'Patient, doctor, and medication name are required.' });
  }

  const prescription = await prisma.prescription.create({
    data: {
      patientName,
      doctorName,
      medication,
      dosage: dosage || 'As prescribed',
      quantity: Number(quantity || 1),
      expiryDate: new Date(expiryDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)),
      status: status || 'ACTIVE',
      notes: notes || ''
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'PRESCRIPTION_CREATED',
      details: `Prescription for ${patientName} created`,
      userId: req.user.id
    }
  });

  return res.status(201).json(prescription);
});

app.get('/api/sales', requireAuth, async (req, res) => {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true, cashier: true, saleItems: { include: { product: true } } }
  });
  return res.json(sales);
});

app.post('/api/sales', requireAuth, async (req, res) => {
  const { customerId, items, paymentType, discount, cashReceived } = req.body;

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'At least one item is required for the sale.' });
  }

  let subtotal = 0;

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) return res.status(404).json({ message: `Product ${item.productId} not found.` });
    if (product.stock < Number(item.quantity || 0)) {
      return res.status(400).json({ message: `Not enough stock for ${product.name}` });
    }
    subtotal += product.price * Number(item.quantity || 0);
  }

  const discountAmount = Number(discount || 0);
  const grandTotal = subtotal - discountAmount;
  const paid = Number(cashReceived || grandTotal);

  const sale = await prisma.sale.create({
    data: {
      saleNumber: `SALE-${Date.now()}`,
      customerId: customerId || null,
      cashierId: req.user.id,
      subtotal,
      discount: discountAmount,
      total: grandTotal,
      paid,
      paymentType: paymentType || 'CASH',
      saleItems: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          total: Number(item.price || 0) * Number(item.quantity || 1)
        }))
      }
    }
  });

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          stock: product.stock - Number(item.quantity || 0)
        }
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      action: 'SALE_CREATED',
      details: `Sale ${sale.saleNumber} completed for total ${grandTotal}`,
      userId: req.user.id
    }
  });

  return res.status(201).json(sale);
});

app.get('/api/reports', requireAuth, async (req, res) => {
  const sales = await prisma.sale.findMany({
    include: { saleItems: true }
  });

  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const unitsSold = sales.reduce((sum, sale) => {
    return sum + sale.saleItems.reduce((s, item) => s + item.quantity, 0);
  }, 0);

  const topProducts = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5
  });

  const detailed = [];
  for (const item of topProducts) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (product) {
      detailed.push({
        product: product.name,
        quantity: item._sum.quantity || 0
      });
    }
  }

  return res.json({
    revenue,
    unitsSold,
    totalSales: sales.length,
    topProducts: detailed
  });
});

app.get('/api/users', requireAuth, async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
  return res.json(users);
});

app.get('/api/audit-logs', requireAuth, async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  return res.json(logs);
});

app.listen(port, () => {
  console.log(`Pharmacy POS API running on http://localhost:${port}`);
});
