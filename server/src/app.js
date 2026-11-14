import express from 'express';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import rootRoutes from './routes/root.routes.js';

const app = express();

app.use(express.json({ limit: '10kb' }));
app.use('/', rootRoutes);
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);

export default app;