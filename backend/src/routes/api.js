import { createHash } from 'node:crypto';
import { Router } from 'express';
import Pillar from '../models/Pillar.js';
import Work from '../models/Work.js';
import { getCached, setCached } from '../config/cache.js';
import { worksQuerySchema } from '../validators/works.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

router.get('/about', (req, res) => res.json({
  organization: 'Mahreen Indonesia',
  tagline: 'Mahreen Indonesia Berkarya untuk Indonesia.',
  sourceUrl: 'https://mahreenindonesia.com/tentang',
  history: [
    { year: 2024, title: 'Gagasan dan riset', description: 'Proses riset, observasi, dan pengembangan gagasan dimulai untuk mempertemukan pengetahuan, inovasi, dan karya yang bermanfaat.' },
    { year: 2026, title: 'Momentum kelembagaan', description: 'Mahreen Indonesia memasuki babak kelembagaan melalui Keputusan Menteri Hukum RI AHU-A089408.AH.01.30.Tahun 2026.' }
  ],
  belief: 'Dari pengetahuan, lahir gagasan. Dari gagasan, lahir karya. Dari karya, tumbuh dampak.',
  vision: 'Menjadi perusahaan yang inovatif dalam menghadirkan karya, layanan, dan kontribusi nyata di bidang kreatif, digital, dan sosial bagi masyarakat Indonesia.',
  mission: [
    'Mengembangkan bidang fashion, digital, kreatif, dan sosial yang berdampak positif bagi masyarakat.',
    'Menghadirkan layanan, karya, dan solusi yang bermanfaat melalui pendekatan kreatif dan profesional.',
    'Membangun kolaborasi dan pemberdayaan yang mendorong perkembangan ekonomi kreatif di Indonesia.',
    'Menjadikan Mahreen Indonesia sebagai ruang bertumbuh yang menghubungkan ide, bakat, dan peluang.'
  ],
  leadership: [
    { name: 'Mohamad Dzikri Arfiansyah, S.T.', role: 'Founder' },
    { name: 'Tania Restiani Fajar', role: 'Chief Executive Officer' }
  ],
  legal: {
    nib: '1203260152054',
    haki: { registrationNumber: '001180040', applicationNumber: 'EC002026042583' },
    ministerialDecree: 'AHU-A089408.AH.01.30.Tahun 2026',
    sourceUrl: 'https://mahreenindonesia.com/tentang'
  },
  portfolioStats: [
    { label: 'Proyek selesai', value: '50+' },
    { label: 'Pilar ekosistem', value: '5' },
    { label: 'Kolaborasi CSR', value: '15+' },
    { label: 'Dampak positif', value: '100%' }
  ],
  portfolioStatsSource: 'https://mahreenindonesia.com/portofolio',
  homeStats: [
    { label: 'Mitra kampus', value: '50+' },
    { label: 'Proyek selesai', value: '10+' },
    { label: 'Kolaborasi', value: '15+' },
    { label: 'Events program', value: '20+' },
    { label: 'Peduli Mahreen', value: '10+' },
    { label: 'Business pillar', value: '4' }
  ],
  homeStatsSource: 'https://mahreenindonesia.com/'
}));

router.get('/pillars', async (req, res, next) => {
  try {
    const [pillars, counts] = await Promise.all([
      Pillar.find().sort({ name: 1 }).lean(),
      Work.aggregate([{ $group: { _id: '$pillar', count: { $sum: 1 } } }])
    ]);
    const countByPillar = new Map(counts.map(({ _id, count }) => [_id, count]));
    res.json(pillars.map(({ _id, name, tagline, description, officialUrl, colorHex }) => ({
      id: _id, name, tagline, description, officialUrl, colorHex, worksCount: countByPillar.get(_id) || 0
    })));
  } catch (error) { next(error); }
});

router.get('/categories', async (req, res, next) => {
  try {
    res.json(await Work.distinct('category').then(items => items.sort((a, b) => a.localeCompare(b))));
  } catch (error) { next(error); }
});

router.get('/works/stats', async (req, res, next) => {
  try {
    const [totalWorks, byPillar, byYear] = await Promise.all([
      Work.countDocuments(),
      Work.aggregate([{ $group: { _id: '$pillar', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Work.aggregate([{ $group: { _id: '$year', count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    ]);
    res.json({
      totalWorks,
      byPillar: byPillar.map(({ _id, count }) => ({ pillar: _id, count })),
      byYear: byYear.map(({ _id, count }) => ({ year: _id, count }))
    });
  } catch (error) { next(error); }
});

router.get('/works', async (req, res, next) => {
  try {
    const parsed = worksQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: { message: parsed.error.issues.map(issue => issue.message).join(', '), code: 'VALIDATION_ERROR' }
      });
    }
    const params = parsed.data;
    if (params.pillar && !await Pillar.exists({ _id: params.pillar })) {
      return res.status(400).json({ error: { message: 'Pilar tidak valid', code: 'VALIDATION_ERROR' } });
    }
    const cacheKey = `works:${createHash('sha256').update(JSON.stringify(params)).digest('hex')}`;
    const cached = await getCached(cacheKey);
    if (cached) return res.json(cached);

    const filter = {};
    if (params.pillar) filter.pillar = params.pillar;
    if (params.category) filter.category = params.category;
    if (params.year) filter.year = params.year;
    if (params.q) filter.$text = { $search: params.q };
    const sort = params.sort === 'newest' ? { year: -1, createdAt: -1 } :
      params.sort === 'oldest' ? { year: 1, createdAt: 1 } : { title: 1 };
    const [records, total] = await Promise.all([
      Work.find(filter).sort(sort).skip((params.page - 1) * params.limit).limit(params.limit).lean(),
      Work.countDocuments(filter)
    ]);
    const response = {
      data: records.map(({ _id, title, pillar, category, year, description, slug, sourceType, sourceUrl }) => ({
        id: String(_id), title, pillar, category, year, description, slug, sourceType, sourceUrl
      })),
      pagination: { page: params.page, limit: params.limit, total, totalPages: Math.ceil(total / params.limit) }
    };
    await setCached(cacheKey, response);
    res.json(response);
  } catch (error) { next(error); }
});

router.get('/works/:slug', async (req, res, next) => {
  try {
    const work = await Work.findOne({ slug: req.params.slug }).lean();
    if (!work) return res.status(404).json({ error: { message: 'Karya tidak ditemukan', code: 'NOT_FOUND' } });
    const { _id, __v, ...data } = work;
    res.json({ id: String(_id), ...data });
  } catch (error) { next(error); }
});

export default router;
