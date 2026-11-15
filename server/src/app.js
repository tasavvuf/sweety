import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './config/openapi.js';
import analyticsRoutes from './routes/analytics.routes.js';
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import healthRoutes from './routes/health.routes.js';
import readingRoutes from './routes/reading.routes.js';
import reportRoutes from './routes/report.routes.js';
import rootRoutes from './routes/root.routes.js';

const app = express();

app.set('trust proxy', 1);

const configuredOrigins = process.env.CLIENT_URL
	? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
	: [];

const defaultAllowedOrigins = [
	'https://sweety-one.vercel.app',
	'http://localhost:5173',
	'http://localhost:3000',
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultAllowedOrigins])).filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);

			const normalizedOrigin = origin.replace(/\/$/, '');
			const isAllowed =
				allowedOrigins.includes(normalizedOrigin) ||
				normalizedOrigin.endsWith('.vercel.app') ||
				process.env.NODE_ENV !== 'production';

			if (isAllowed) {
				return callback(null, true);
			}

			return callback(null, false);
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
		exposedHeaders: ['Set-Cookie'],
	}),
);

app.use(express.json({ limit: '10kb' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.use('/', rootRoutes);
app.use('/health', healthRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/auth', authRoutes);

export default app;
