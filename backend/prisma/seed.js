import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  {
    name: 'Admin User',
    email: 'admin@friendspharmacy.com',
    passwordHash: await bcrypt.hash('Password123!', 10),
    role: 'ADMIN'
  },
  {
    name: 'Manager User',
    email: 'manager@friendspharmacy.com',
    passwordHash: await bcrypt.hash('Password123!', 10),
    role: 'MANAGER'
  },
  {
    name: 'Cashier User',
    email: 'cashier@friendspharmacy.com',
    passwordHash: await bcrypt.hash('Password123!', 10),
    role: 'CASHIER'
  }
];

const products = [
  { name: 'Paracetamol 500mg', category: 'Pain Relief', brand: 'Generic', sku: 'PAR500', stock: 120, reorderLevel: 25, cost: 2.5, price: 5.5, unit: 'pack' },
  { name: 'Amoxicillin 250mg', category: 'Antibiotic', brand: 'MediCare', sku: 'AMX250', stock: 60, reorderLevel: 15, cost: 4.2, price: 8.9, unit: 'pack' },
  { name: 'Cough Syrup', category: 'Cough & Cold', brand: 'WellCare', sku: 'COUGH01', stock: 32, reorderLevel: 12, cost: 3.1, price: 7.4, unit: 'bottle' },
  { name: 'Vitamin C 1000mg', category: 'Supplement', brand: 'VitalPlus', sku: 'VITC01', stock: 90, reorderLevel: 20, cost: 1.8, price: 4.8, unit: 'bottle' },
  { name: 'Salbutamol Inhaler', category: 'Respiratory', brand: 'BreatheFree', sku: 'SALB01', stock: 30, reorderLevel: 10, cost: 8.6, price: 15.0, unit: 'pcs' },
  { name: 'Blood Pressure Monitor', category: 'Medical Devices', brand: 'MediTrack', sku: 'BPM01', stock: 12, reorderLevel: 5, cost: 18.0, price: 32.5, unit: 'pcs' }
];

const customers = [
  { name: 'James Okafor', phone: '+2348012345678', email: 'james@example.com', address: 'Abuja', loyaltyId: 'LOY-1001' },
  { name: 'Mary Adebayo', phone: '+2348034567890', email: 'mary@example.com', address: 'Lagos', loyaltyId: 'LOY-1002' },
  { name: 'Daniel Smith', phone: '+2348056789012', email: 'daniel@example.com', address: 'Port Harcourt', loyaltyId: 'LOY-1003' }
];

const prescriptions = [
  {
    patientName: 'Grace Ade',
    doctorName: 'Dr. Aisha Bello',
    medication: 'Paracetamol 500mg',
    dosage: '2 tablets twice daily',
    quantity: 12,
    expiryDate: new Date('2026-12-31T00:00:00.000Z'),
    status: 'ACTIVE',
    notes: 'Use for 7 days'
  },
  {
    patientName: 'Tunde Johnson',
    doctorName: 'Dr. Kola Adeyemi',
    medication: 'Amoxicillin 250mg',
    dosage: '1 capsule 12 hourly',
    quantity: 20,
    expiryDate: new Date('2026-10-10T00:00:00.000Z'),
    status: 'PENDING',
    notes: 'Complete antibiotic cycle'
  }
];

for (const user of users) {
  await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: user
  });
}

for (const product of products) {
  await prisma.product.upsert({
    where: { sku: product.sku },
    update: {},
    create: product
  });
}

for (const customer of customers) {
  await prisma.customer.upsert({
    where: { loyaltyId: customer.loyaltyId },
    update: {},
    create: customer
  });
}

for (const prescription of prescriptions) {
  await prisma.prescription.create({ data: prescription });
}

const adminUser = await prisma.user.findUnique({ where: { email: 'admin@friendspharmacy.com' } });
const firstCustomer = await prisma.customer.findUnique({ where: { loyaltyId: 'LOY-1001' } });
const firstProduct = await prisma.product.findUnique({ where: { sku: 'PAR500' } });
const secondProduct = await prisma.product.findUnique({ where: { sku: 'VITC01' } });

if (adminUser && firstCustomer && firstProduct && secondProduct) {
  const sale = await prisma.sale.create({
    data: {
      saleNumber: 'SALE-1001',
      cashierId: adminUser.id,
      customerId: firstCustomer.id,
      subtotal: 10.3,
      discount: 0,
      total: 10.3,
      paid: 10.3,
      paymentType: 'CASH',
      status: 'COMPLETED',
      saleItems: {
        create: [
          { productId: firstProduct.id, quantity: 2, price: 5.5, total: 11.0 },
          { productId: secondProduct.id, quantity: 1, price: 4.8, total: 4.8 }
        ]
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'SEED_SALE_CREATED',
      details: `Demo sale ${sale.saleNumber} created during seed`,
      userId: adminUser.id
    }
  });
}

console.log('Seeding complete');
await prisma.$disconnect();
