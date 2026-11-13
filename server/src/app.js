import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import userRoutes from './routes/user.routes.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
app.use(helmet());
const allowedOrigins = [
  'https://jobby-fullstack.vercel.app',
  'http://localhost:5173',
  ...(process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
];

app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'jobby-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api', userRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
