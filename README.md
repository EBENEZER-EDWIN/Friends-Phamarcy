This project is a full mini pharmacy POS system built with React + Vite on the frontend and Node.js + Express + Prisma + SQLite on the backend.

Features included:
- Inventory management with stock and low-stock alerts
- Sales / POS checkout with cart, discounts, and payment types
- Customers and loyalty tracking
- Prescriptions management with validity tracking
- User roles and login (Admin / Manager / Cashier)
- Sales reports and dashboard summaries
- Returns and audit logs
- Receipt generation support (PDF-ready print flow)
- Docker support for local development
- Seeded demo data for quick testing

Project structure:
- frontend/: React + Vite front-end
- backend/: Express + Prisma + SQLite API
- docs/screenshots/: sample UI screenshots (SVG mockups)

Quick start:
1. Install dependencies:
   npm install
2. Create your environment file:
   cp .env.example .env
3. Push the Prisma schema to SQLite:
   npm run db:push
4. Seed demo data:
   npm run db:seed
5. Start app:
   npm run dev

The frontend will run on http://localhost:5173 and the backend on http://localhost:4000.

Default demo login:
- Email: admin@friendspharmacy.com
- Password: Password123!

If you want to run only the backend:
- npm run start --workspace backend

If you want to run only the frontend:
- npm run dev --workspace frontend

Docker:
- docker-compose up --build

Screenshots:
- docs/screenshots/pos-dashboard.svg
- docs/screenshots/inventory.svg
- docs/screenshots/checkout.svg

API overview:
- POST /api/auth/login
- GET /api/dashboard
- GET /api/products
- POST /api/products
- GET /api/customers
- POST /api/customers
- GET /api/prescriptions
- POST /api/prescriptions
- GET /api/sales
- POST /api/sales
- GET /api/reports
- GET /api/users
- GET /api/audit-logs

Important notes:
- The SQLite database is created at backend/prisma/dev.db.
- Prisma schema and seed script are in backend/prisma.
- For a real production deployment, switch to PostgreSQL and configure secure JWT secrets and environment variables.

License:
This project is intended for educational/demo usage.
