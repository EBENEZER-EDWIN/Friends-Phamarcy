# Friends Pharmacy POS

A full mini pharmacy point-of-sale system built with React + Vite on the frontend and Node.js + Express + Prisma + SQLite on the backend.

## Features
- Inventory management with stock tracking and low-stock alerts
- POS checkout with cart, discounts, and payment selection
- Customer management and loyalty tracking
- Prescription records with expiry and status tracking
- User login and role-based access (Admin, Manager, Cashier)
- Sales dashboard and revenue reports
- Returns-ready sales flow and audit log tracking
- PDF-friendly receipt generation workflow
- Docker support for local development
- Seeded demo data for quick testing

## Tech stack
- Frontend: React + Vite + CSS modules / custom CSS
- Backend: Node.js + Express + Prisma + SQLite
- Auth: JWT tokens with bcrypt password hashing
- Database: SQLite for local/demo use

## Project structure
- backend/: Express API and Prisma database config
- frontend/: React app and UI screens
- docs/screenshots/: sample UI mockups for dashboard, inventory, and checkout
- .env.example: root environment template
- docker-compose.yml: local Docker setup

## Prerequisites
- Node.js 18+
- npm 9+
- Git

## Quick start
1. Open a terminal in the project root.
2. Install dependencies:
   npm install
3. Create environment files:
   cp .env.example .env
   cp backend/.env.example backend/.env
4. Generate Prisma client and initialize SQLite DB:
   npm run db:push
5. Seed the database with demo data:
   npm run db:seed
6. Start the app:
   npm run dev

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Demo login
- Email: admin@friendspharmacy.com
- Password: Password123!

## Docker option
You can also run the app with Docker:

1. Build and start containers:
   docker-compose up --build
2. Access the frontend at:
   http://localhost:5173
3. The backend API will be available at:
   http://localhost:4000/api

## Useful commands
- Run only backend:
  npm run start --workspace backend
- Run only frontend:
  npm run dev --workspace frontend
- Regenerate Prisma client:
  npm run prisma:generate
- Reapply Prisma schema:
  npm run db:push

## Screenshots
The repo includes example UI mockups here:
- docs/screenshots/pos-dashboard.svg
- docs/screenshots/inventory.svg
- docs/screenshots/checkout.svg

## API overview
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

## Notes
- SQLite is intended for demo/local development.
- For production, migrate to PostgreSQL and secure JWT secrets.
- The database file is generated at backend/prisma/dev.db.

## License
This project is intended for education and demonstration purposes.
