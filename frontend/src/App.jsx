import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getAbout, getCategories, getPillars, getStats, getWork, getWorks } from './api.js';

const apiDocsUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1').replace(/\/api\/v1\/?$/, '/api/docs');

function useDirectoryData() {
  const [pillars, setPillars] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ totalWorks: 0, byYear: [] });
  const [about, setAbout] = useState(null);
  const [metaError, setMetaError] = useState('');

  useEffect(() => {
    Promise.all([getPillars(), getCategories(), getStats(), getAbout()])
      .then(([pillarData, categoryData, statsData, aboutData]) => {
        setPillars(pillarData);
        setCategories(categoryData);
        setStats(statsData);
        setAbout(aboutData);
      })
      .catch(error => setMetaError(error.message));
  }, []);
  return { pillars, categories, stats, about, metaError };
}

function Header() {
  return <header className="site-header"><Link className="brand" to="/" aria-label="Mahreen Explorer, beranda"><span className="brand-mark">m.</span><span>Mahreen Explorer</span></Link><a className="docs-link" href={apiDocsUrl} target="_blank" rel="noreferrer">Dokumentasi API</a></header>;
}

function Explorer() {
  const { pillars, categories, stats, about, metaError } = useDirectoryData();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = useMemo(() => ({
    q: searchParams.get('q') || '', pillar: searchParams.get('pillar') || '',
    category: searchParams.get('category') || '', year: searchParams.get('year') || '',
    sort: searchParams.get('sort') || 'newest', page: Number(searchParams.get('page') || 1)
  }), []);
  const [queryText, setQueryText] = useState(initial.q);
  const [filters, setFilters] = useState(initial);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setFilters(current => current.q === queryText ? current : ({ ...current, q: queryText, page: 1 })), 400);
    return () => window.clearTimeout(timer);
  }, [queryText]);

  const setFilter = (key, value) => setFilters(current => ({ ...current, [key]: value, page: 1 }));
  const clearFilters = () => { setQueryText(''); setFilters({ q: '', pillar: '', category: '', year: '', sort: 'newest', page: 1 }); };

  useEffect(() => {
    const next = {};
    Object.entries(filters).forEach(([key, value]) => { if (value) next[key] = String(value); });
    setSearchParams(next, { replace: true });
    let cancelled = false;
    setStatus('loading');
    setError('');
    getWorks({ ...filters, limit: 9 })
      .then(data => { if (!cancelled) { setResult(data); setStatus('ready'); } })
      .catch(fetchError => { if (!cancelled) { setError(fetchError.message); setStatus('error'); } });
    return () => { cancelled = true; };
  }, [filters, requestVersion, setSearchParams]);

  const activePillar = pillars.find(pillar => pillar.id === filters.pillar);
  const years = stats.byYear.map(item => item.year).sort((a, b) => b - a);
  const activeFilters = Boolean(filters.q || filters.pillar || filters.category || filters.year);

  return <>
    <Header />
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="hero-kicker"><span className="spark">✳</span> Direktori karya lintas pilar</p><h1 id="hero-title">Mahreen<br /><span>Explorer</span><i className="hero-period">.</i></h1><div className="hero-side-note"><span className="note-rule" />Satu Ide.<br />Satu Karya.<br /><b>Satu Dampak.</b></div><p className="hero-description">Kenali program, karya, dan gerakan Mahreen Indonesia. Temukan yang bikin kamu penasaran, dalam satu ruang.</p></div>
        <div className="hero-stamp" aria-hidden="true"><span>IDE</span><b>✳</b><span>JADI DAMPAK</span></div>
        <form className="search-form" onSubmit={event => event.preventDefault()} role="search"><label htmlFor="work-search">Cari karya Mahreen</label><div className="search-control"><span className="search-icon" aria-hidden="true">⌕</span><input id="work-search" type="search" value={queryText} onChange={event => setQueryText(event.target.value)} placeholder="Coba “website”, “literasi”, atau “branding”" /><kbd>↵</kbd></div></form>
      </section>

      <section className="explorer" aria-labelledby="work-heading">
        <div className="section-heading"><div><p className="section-overline">Ruang jelajah</p><h2 id="work-heading">Karya yang bergerak</h2></div><p className="result-total"><strong>{status === 'ready' ? result.pagination.total : stats.totalWorks}</strong> karya<br />dari 5 pilar</p></div>
        <div className="filter-area">
          <div className="pillar-filters" aria-label="Filter berdasarkan pilar">
            <button className={`patch all-patch ${!filters.pillar ? 'selected' : ''}`} onClick={() => setFilter('pillar', '')} aria-pressed={!filters.pillar}>Semua pilar</button>
            {pillars.map(pillar => <button key={pillar.id} className={`patch ${filters.pillar === pillar.id ? 'selected' : ''}`} style={{ '--pillar': pillar.colorHex }} onClick={() => setFilter('pillar', pillar.id)} aria-pressed={filters.pillar === pillar.id}>{pillar.name}<span>{pillar.worksCount}</span></button>)}
          </div>
          <div className="select-filters"><label>Kategori<select value={filters.category} onChange={event => setFilter('category', event.target.value)}><option value="">Semua kategori</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label><label>Tahun<select value={filters.year} onChange={event => setFilter('year', event.target.value)}><option value="">Semua tahun</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></label><label>Urutkan<select value={filters.sort} onChange={event => setFilter('sort', event.target.value)}><option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="title">Nama A–Z</option></select></label></div>
        </div>
        {metaError && <p className="inline-error" role="status">Sebagian informasi filter belum tersedia. {metaError}</p>}
        {activePillar && <p className="active-context"><span style={{ backgroundColor: activePillar.colorHex }} />{activePillar.tagline}</p>}
        <div className="results-bar"><p>{status === 'ready' ? <>Menampilkan <strong>{result.data.length ? (result.pagination.page - 1) * result.pagination.limit + 1 : 0}–{Math.min(result.pagination.page * result.pagination.limit, result.pagination.total)}</strong> dari <strong>{result.pagination.total}</strong> karya</> : 'Menyiapkan ruang jelajah'}</p>{activeFilters && <button className="clear-button" onClick={clearFilters}>Bersihkan filter</button>}</div>
        {status === 'loading' && <div className="state-panel loading-state" role="status"><span className="loader" />Sedang merapikan karya untukmu…</div>}
        {status === 'error' && <div className="state-panel error-state" role="alert"><span className="state-symbol">!</span><h3>Ruang jelajah sedang sulit dijangkau</h3><p>{error}</p><button className="dark-button" onClick={() => setRequestVersion(version => version + 1)}>Coba lagi</button></div>}
        {status === 'ready' && result.data.length === 0 && <div className="state-panel empty-state"><span className="state-symbol">⌕</span><h3>Belum ketemu yang dicari?</h3><p>Coba kata kunci lain atau buka semua pilar. Mungkin ide berikutnya ada di sana.</p><button className="dark-button" onClick={clearFilters}>Jelajahi semua karya</button></div>}
        {status === 'ready' && result.data.length > 0 && <div className="work-grid">{result.data.map((work, index) => {
          const pillar = pillars.find(item => item.id === work.pillar);
          return <article className={`work-card card-${index % 3}`} key={work.id} style={{ '--wash': pillar?.colorHex || '#FF3D7A' }}><div className="card-topline"><span className="pillar-badge" style={{ '--pillar': pillar?.colorHex || '#FF3D7A' }}>{pillar?.name || work.pillar}</span><span className="work-year">{work.year}</span></div><p className="work-category">{work.category}</p><h3>{work.title}</h3><p className="work-description">{work.description}</p><div className="card-footer"><span className="concept-label">{work.sourceType === 'official' ? 'Karya portofolio' : 'Contoh konsep'}</span><Link className="detail-link" to={`/karya/${work.slug}`}>Lihat detail</Link></div></article>;
        })}</div>}
        {status === 'ready' && result.pagination.totalPages > 1 && <nav className="pagination" aria-label="Halaman karya"><button disabled={filters.page <= 1} onClick={() => setFilters(current => ({ ...current, page: current.page - 1 }))}>Sebelumnya</button><span>Halaman <strong>{filters.page}</strong> dari <strong>{result.pagination.totalPages}</strong></span><button disabled={filters.page >= result.pagination.totalPages} onClick={() => setFilters(current => ({ ...current, page: current.page + 1 }))}>Berikutnya</button></nav>}
      </section>
      {about && <AboutSection about={about} />}
    </main>
    <footer className="site-footer"><Link className="footer-mark" to="/">m.</Link><p>Ruang untuk mengenal karya, program, dan dampak Mahreen Indonesia.</p><span>Jelajah dengan rasa ingin tahu.</span></footer>
  </>;
}

function AboutSection({ about }) {
  return <section className="about-section" aria-labelledby="about-heading">
    <div className="about-intro"><p className="section-overline">Tentang Mahreen Indonesia</p><h2 id="about-heading">Dari pengetahuan,<br /><span>tumbuh dampak.</span></h2><p>{about.belief}</p><a className="about-source" href={about.sourceUrl} target="_blank" rel="noreferrer">Baca profil resmi Mahreen</a></div>
    <div className="about-proof">
      <div className="about-stats-heading"><div><p className="section-overline">Jejak kolaborasi</p><h3>Ekosistem yang terus bergerak</h3></div><a href={about.portfolioStatsSource} target="_blank" rel="noreferrer">Sumber: portofolio resmi</a></div>
      <div className="about-stats">{about.portfolioStats.map(stat => <div className="about-stat" key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
      <p className="stats-note">Statistik di atas mengikuti halaman portofolio resmi. Angka di beranda utama dapat memakai metrik dan cakupan yang berbeda.</p>
    </div>
    <div className="about-story"><div className="story-heading"><p className="section-overline">Perjalanan</p><h3>Gagasan menjadi karya</h3></div><div className="story-timeline">{about.history.map(item => <article className="timeline-item" key={item.year}><strong>{item.year}</strong><div><h4>{item.title}</h4><p>{item.description}</p></div></article>)}</div></div>
    <div className="about-vision"><p className="section-overline">Arah & tujuan</p><h3>Visi</h3><p>{about.vision}</p><h3>Misi</h3><ol>{about.mission.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}</ol></div>
    <div className="about-bottom"><div><p className="section-overline">Kepemimpinan</p>{about.leadership.map(person => <p className="leader-line" key={person.name}><strong>{person.name}</strong><span>{person.role}</span></p>)}</div><div className="legal-note"><p className="section-overline">Legalitas</p><p>NIB <strong>{about.legal.nib}</strong></p><p>HAKI <strong>{about.legal.haki.registrationNumber}</strong></p><p>Keputusan Menteri Hukum <strong>{about.legal.ministerialDecree}</strong></p><a href={about.legal.sourceUrl} target="_blank" rel="noreferrer">Lihat informasi resmi</a></div></div>
  </section>;
}

function WorkDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { pillars } = useDirectoryData();
  const [work, setWork] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getWork(slug).then(data => { if (!cancelled) { setWork(data); setStatus('ready'); } })
      .catch(fetchError => { if (!cancelled) { setError(fetchError.message); setStatus('error'); } });
    return () => { cancelled = true; };
  }, [slug]);
  const pillar = pillars.find(item => item.id === work?.pillar);

  return <><Header /><main className="detail-page"><button className="back-link" onClick={() => navigate(-1)}>Kembali ke penjelajahan</button>{status === 'loading' && <div className="state-panel loading-state"><span className="loader" />Sedang membuka detail karya…</div>}{status === 'error' && <div className="state-panel error-state"><span className="state-symbol">!</span><h1>Karya belum bisa dibuka</h1><p>{error}</p><Link className="dark-button" to="/">Kembali ke semua karya</Link></div>}{status === 'ready' && <article className="detail-sheet" style={{ '--wash': pillar?.colorHex || '#FF3D7A' }}><p className="section-overline">Detail karya</p><div className="detail-meta"><span className="pillar-badge" style={{ '--pillar': pillar?.colorHex || '#FF3D7A' }}>{pillar?.name || work.pillar}</span><span>{work.category}</span><span>{work.year}</span><span className="concept-label">{work.sourceType === 'official' ? 'Karya portofolio' : 'Contoh konsep'}</span></div><h1>{work.title}</h1><p className="detail-description">{work.description}</p>{work.sourceUrl && <a className="work-source-link" href={work.sourceUrl} target="_blank" rel="noreferrer">Sumber karya: portofolio Mahreen Indonesia</a>}<div className="pillar-note"><span className="pillar-note-dot" style={{ backgroundColor: pillar?.colorHex }} /><div><h2>{pillar?.name || 'Pilar Mahreen'}</h2><p>{pillar?.tagline}</p>{pillar?.description && <p>{pillar.description}</p>}</div></div>{pillar?.officialUrl && <a className="official-link" href={pillar.officialUrl} target="_blank" rel="noreferrer">Pelajari pilar ini lebih lanjut</a>}</article>}</main><footer className="site-footer"><Link className="footer-mark" to="/">m.</Link><p>Ruang untuk mengenal karya, program, dan dampak Mahreen Indonesia.</p><span>Jelajah dengan rasa ingin tahu.</span></footer></>;
}

export default function App() {
  return <Routes><Route path="/" element={<Explorer />} /><Route path="/karya/:slug" element={<WorkDetail />} /><Route path="*" element={<NotFound />} /></Routes>;
}

function NotFound() {
  return <><Header /><main className="not-found"><p className="section-overline">Halaman tidak ditemukan</p><h1>Karya ini<br />belum ada di peta.</h1><Link className="dark-button" to="/">Kembali ke penjelajahan</Link></main></>;
}
