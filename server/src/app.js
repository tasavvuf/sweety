import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './config/openapi.js';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import readingRoutes from './routes/reading.routes.js';
import reportRoutes from './routes/report.routes.js';
import rootRoutes from './routes/root.routes.js';

const app = express();

app.use(express.json({ limit: '10kb' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.use('/', rootRoutes);
app.use('/health', healthRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);

export default app;
