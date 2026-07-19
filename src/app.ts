import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import walletRoutes from './routes/walletRoutes';
import campaignRoutes from './routes/campaignRoutes';
import stripeRoutes from './routes/stripeRoutes';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/stripe', stripeRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

export default app;
