# Jobby App — Full-stack React + Express + PostgreSQL

## Stack
- React + Vite + React Router
- Node.js + Express REST API
- PostgreSQL + Prisma ORM
- JWT authentication + bcrypt password hashing
- Zod request validation

## Requirements
- Node.js 20+
- PostgreSQL 14+
- npm

## 1. Configure backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set:
- `DATABASE_URL` to your PostgreSQL connection string
- `JWT_SECRET` to a long random secret
- `CLIENT_ORIGIN` to `http://localhost:5173`

Example local PostgreSQL URL:
`postgresql://postgres:YOUR_PASSWORD@localhost:5432/jobby_db?schema=public`

Create the database first (for example in psql):
```sql
CREATE DATABASE jobby_db;
```

Then:
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```
Backend runs at http://localhost:5000

## 2. Configure frontend

Open a second terminal:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Frontend runs at http://localhost:5173

## Demo account
After seeding:
- Email: `demo@jobby.dev`
- Password: `Demo@123`

You can also register your own account.

## Main API routes

Public:
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/jobs`
- `GET /api/jobs/:id`

Authenticated:
- `GET /api/auth/me`
- `GET /api/saved-jobs`
- `POST /api/saved-jobs/:jobId`
- `DELETE /api/saved-jobs/:jobId`
- `GET /api/applications`
- `POST /api/applications`
- `PATCH /api/applications/:id`
- `DELETE /api/applications/:id`
- `POST /api/activity/recent/:jobId`
- `GET /api/activity/recent`

## Useful query parameters
`GET /api/jobs?search=react&employmentType=FULL_TIME&minSalary=5&sortBy=salary&sortOrder=desc&page=1&limit=8`

Supported employment types: `FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT`, `FREELANCE`.

## Deployment outline

### PostgreSQL
Create a managed PostgreSQL database with your chosen provider and copy its connection string.

### Backend
Deploy the `server` directory as a Node web service:
- Build command: `npm install && npx prisma generate`
- Start command: `npm start`
- Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`
- After deployment, run `npx prisma migrate deploy` and `npm run db:seed` once from the server environment/console.

### Frontend
Deploy the `client` directory:
- Build command: `npm install && npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to your deployed backend origin, for example `https://your-api.example.com/api`

Update backend `CLIENT_ORIGIN` to your deployed frontend URL.

## Important implementation notes
- Saved jobs, recently viewed jobs and applications are stored in PostgreSQL per user.
- Job listings are seeded sample records owned by the app. They are not live scraped vacancies.
- The demo account is for local demonstration. Change/remove it before a public production launch.
- For a public production system, add email verification, password reset, rate limiting, audit logging, stronger operational monitoring, backups and a formal security review.
