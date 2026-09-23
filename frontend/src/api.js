const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || 'Permintaan belum berhasil. Coba lagi.');
  return payload;
}

export function getAbout() { return request('/about'); }
export function getPillars() { return request('/pillars'); }
export function getCategories() { return request('/categories'); }
export function getStats() { return request('/works/stats'); }
export function getWork(slug) { return request(`/works/${encodeURIComponent(slug)}`); }
export function getWorks(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) query.set(key, value);
  });
  return request(`/works?${query.toString()}`);
}
