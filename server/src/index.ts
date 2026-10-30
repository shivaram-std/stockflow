import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import dashboardRoutes from './routes/dashboard.routes';
import settingsRoutes from './routes/settings.routes';
import { errorHandler } from './middleware/errorHandler';
import { ensureDemoAccount } from './utils/demo';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible asset loading across hosting configurations
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
app.use(
  cors({
    origin: CORS_ORIGIN ? CORS_ORIGIN.split(',') : true,
    credentials: true,
  })
);

app.use(express.json());

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'StockFlow Server API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Mounted API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Handler for undefined API routes
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint '${req.originalUrl}' not found.` });
});

// Production Static Client Serving & SPA Routing Fallback
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Centralized Error Handling Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`StockFlow Server listening on http://localhost:${PORT}`);
    ensureDemoAccount().catch((err) => {
      console.warn('Could not initialize demo account at startup:', err.message);
    });
  });
}

export default app;
