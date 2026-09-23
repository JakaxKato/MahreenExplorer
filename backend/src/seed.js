import 'dotenv/config';
import slugify from 'slugify';
import { connectDatabase } from './config/database.js';
import Pillar from './models/Pillar.js';
import Work from './models/Work.js';

const pillars = [
  { id: 'mahreen-studio', name: 'Mahreen Studio', tagline: 'Branding & Creative Production', description: 'Divisi kreatif Mahreen Indonesia yang menangani branding, identitas visual, dan produk apparel.', officialUrl: 'https://mahreenindonesia.com/mahreen-studio', colorHex: '#D6336C' },
  { id: 'tanya-mahreen', name: 'Tanya Mahreen', tagline: 'Digital & Technology Development', description: 'Divisi pengembangan digital Mahreen Indonesia — website, aplikasi, dan desain UI/UX.', officialUrl: 'https://mahreenindonesia.com/tanya-mahreen', colorHex: '#6741D9' },
  { id: 'peduli-mahreen', name: 'Peduli Mahreen', tagline: 'Social Impact & Empowerment', description: 'Program dampak sosial dan pemberdayaan komunitas serta pendidikan generasi muda.', officialUrl: 'https://mahreenindonesia.com/peduli-mahreen', colorHex: '#2F9E44' },
  { id: 'mahreen-csr', name: 'Mahreen CSR', tagline: 'Corporate Social Responsibility', description: 'Program tanggung jawab sosial dan keberlanjutan lingkungan dari Mahreen Indonesia.', officialUrl: 'https://mahreenindonesia.com/mahreen-csr', colorHex: '#E8590C' },
  { id: 'magang-mahreen', name: 'Magang Mahreen', tagline: 'Internship Program', description: 'Karya nyata hasil kerja para peserta program internship Mahreen Indonesia.', officialUrl: 'https://mahreenindonesia.com/internship', colorHex: '#1971C2' }
];

const works = [
  { title: 'Urban Odyssey Apparel', pillar: 'mahreen-studio', category: 'Apparel & Branding', year: 2025, description: 'Koleksi busana streetwear modern eksklusif yang memadukan estetika visual urban dengan tren milenial.' },
  { title: 'Rebranding Kopi Selasar', pillar: 'mahreen-studio', category: 'Branding & Identity', year: 2025, description: 'Penyusunan identitas visual baru yang hangat dan kekinian untuk kedai kopi lokal populer.' },
  { title: 'E-Commerce Griya Batik', pillar: 'tanya-mahreen', category: 'Web Development', year: 2025, description: 'Pengembangan website belanja batik premium berbasis Next.js dengan sistem manajemen produk canggih.' },
  { title: 'SehatKu App UI/UX', pillar: 'tanya-mahreen', category: 'UI/UX Design', year: 2025, description: 'Rancangan desain antarmuka aplikasi kesehatan ramah lansia yang fokus pada kemudahan akses navigasi.' },
  { title: 'Pojok Literasi Cigugur', pillar: 'peduli-mahreen', category: 'Social Impact', year: 2025, description: 'Pembangunan perpustakaan komunitas yang terintegrasi dengan akses internet dan laboratorium komputer dasar gratis.' },
  { title: 'Eco-Hub CSR Program', pillar: 'mahreen-csr', category: 'Sustainability', year: 2025, description: 'Inisiatif ekonomi sirkular yang mendaur ulang sisa kemasan produksi pabrik menjadi produk bernilai guna.' },
  { title: 'Inkubator Wirausaha Muda', pillar: 'peduli-mahreen', category: 'Education & Funding', year: 2026, description: 'Program akselerasi keterampilan kepemimpinan dan manajemen keuangan pemuda yang disertai bantuan modal.' },
  { title: 'Pengujian Modul Autentikasi', pillar: 'magang-mahreen', category: 'Quality Assurance', year: 2026, description: 'Dokumentasi pengujian registrasi dan login untuk memastikan setiap skenario berjalan sesuai hasil yang diharapkan.' },
  { title: 'Validasi Database Pengguna', pillar: 'magang-mahreen', category: 'Backend & Database', year: 2026, description: 'Pemeriksaan data pengguna melalui basis data untuk memvalidasi proses registrasi dan integrasi sistem.' },
  { title: 'Website Yayasan Fauzan Adzima', pillar: 'magang-mahreen', category: 'Website Development', year: 2026, description: 'Implementasi halaman utama website yayasan dengan informasi program, capaian, dan ajakan berdonasi.' }
].map(work => ({
  ...work,
  slug: slugify(work.title, { lower: true, strict: true }),
  sourceType: 'official',
  sourceUrl: 'https://mahreenindonesia.com/portofolio'
}));

await connectDatabase();
await Promise.all([
  ...pillars.map(({ id, ...pillar }) => Pillar.updateOne({ _id: id }, { $set: pillar }, { upsert: true })),
  ...works.map(work => Work.updateOne({ slug: work.slug }, { $set: work }, { upsert: true }))
]);
console.log(`Seeded or updated ${pillars.length} pillars and ${works.length} portfolio works.`);
await import('mongoose').then(({ default: mongoose }) => mongoose.disconnect());
