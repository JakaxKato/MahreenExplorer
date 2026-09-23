import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('API infrastructure', () => {
  it('returns the health status', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('serves a friendly API overview at the root path', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Mahreen Explorer API');
    expect(response.body.links.documentation).toBe('/api/docs');
  });

  it('returns sourced company profile and portfolio statistics', async () => {
    const response = await request(app).get('/api/v1/about');
    expect(response.status).toBe(200);
    expect(response.body.sourceUrl).toBe('https://mahreenindonesia.com/tentang');
    expect(response.body.portfolioStatsSource).toBe('https://mahreenindonesia.com/portofolio');
    expect(response.body.portfolioStats).toHaveLength(4);
    expect(response.body.vision).toContain('inovatif');
  });

  it('serves API documentation and OpenAPI paths', async () => {
    const docs = await request(app).get('/api/docs/');
    const spec = await request(app).get('/api/openapi.json');
    expect(docs.status).toBe(200);
    expect(spec.body.paths['/about']).toBeDefined();
    expect(spec.body.paths['/works']).toBeDefined();
    expect(spec.body.paths['/works/{slug}']).toBeDefined();
  });

  it('rejects invalid query parameters before accessing the database', async () => {
    const response = await request(app).get('/api/v1/works?limit=51');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns the standard error envelope for unknown routes', async () => {
    const response = await request(app).get('/api/v1/not-a-route');
    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({ message: 'Route tidak ditemukan', code: 'NOT_FOUND' });
  });
});
