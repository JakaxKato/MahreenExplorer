import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import apiRoutes from './routes/api.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map(value => value.trim());
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: { title: 'Mahreen Explorer API', version: '1.0.0', description: 'Direktori karya lintas pilar Mahreen Explorer.' },
    servers: [{ url: '/api/v1' }],
    paths: {
      '/health': { get: { summary: 'Health check', responses: { 200: { description: 'API aktif' } } } },
      '/about': { get: { summary: 'Profil, visi-misi, legalitas, dan statistik Mahreen Indonesia', responses: { 200: { description: 'Profil organisasi dengan sumber data' } } } },
      '/pillars': { get: { summary: 'Daftar pilar dan jumlah karya', responses: { 200: { description: 'Daftar pilar' } } } },
      '/categories': { get: { summary: 'Kategori karya unik', responses: { 200: { description: 'Daftar kategori' } } } },
      '/works': { get: {
        summary: 'Cari dan filter karya',
        parameters: [
          { in: 'query', name: 'q', schema: { type: 'string' } },
          { in: 'query', name: 'pillar', schema: { type: 'string' } },
          { in: 'query', name: 'category', schema: { type: 'string' } },
          { in: 'query', name: 'year', schema: { type: 'integer' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 12, maximum: 50 } },
          { in: 'query', name: 'sort', schema: { type: 'string', enum: ['newest', 'oldest', 'title'], default: 'newest' } }
        ],
        responses: { 200: { description: 'Hasil pencarian berhalaman' }, 400: { description: 'Parameter tidak valid' } }
      } },
      '/works/stats': { get: { summary: 'Statistik karya per pilar dan tahun', responses: { 200: { description: 'Agregasi karya' } } } },
      '/works/{slug}': { get: { summary: 'Detail karya berdasarkan slug', parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Detail karya' }, 404: { description: 'Karya tidak ditemukan' } } } }
    }
  },
  apis: []
});

swaggerSpec.servers = [{ url: `${process.env.PUBLIC_API_URL || ''}/api/v1` }];
if (!process.env.PUBLIC_API_URL) swaggerSpec.servers = [{ url: '/api/v1' }];

app.get('/api/openapi.json', (req, res) => res.json(swaggerSpec));

app.get('/', (req, res) => res.json({
  name: 'Mahreen Explorer API',
  version: '1.0.0',
  status: 'ok',
  message: 'API backend Mahreen Explorer berjalan. Frontend aplikasi di-deploy terpisah di Vercel.',
  basePath: '/api/v1',
  links: {
    health: '/api/v1/health',
    documentation: '/api/docs',
    openapi: '/api/openapi.json'
  }
}));

app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  return callback(Object.assign(new Error('Origin tidak diizinkan oleh CORS'), { status: 403, code: 'CORS_ERROR' }));
} }));
app.use(express.json());
app.use(morgan('tiny'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1', apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
