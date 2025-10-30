const BASE = import.meta.env.VITE_API_BASE_URL;

export const apiEnabled = typeof BASE === 'string' && BASE.length > 0;

async function request(path: string, options: RequestInit = {}, timeoutMs = 8000, retries = 1) {
  if (!apiEnabled) throw new Error('API disabled');
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      signal: controller.signal,
      ...options,
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      throw new Error(text || `HTTP ${r.status}`);
    }
    const ct = r.headers.get('content-type') || '';
    return ct.includes('application/json') ? r.json() : r.text();
  } catch (e) {
    if (retries > 0) return request(path, options, timeoutMs, retries - 1);
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export function postCalculate(payload: unknown) {
  return request('/calculate', { method: 'POST', body: JSON.stringify(payload) });
}

export function postStandardSalePrice(payload: unknown) {
  return request('/standard-sale-price', { method: 'POST', body: JSON.stringify(payload) });
}

export function postSync(payload: unknown) {
  return request('/sync', { method: 'POST', body: JSON.stringify(payload) });
}

export function getSavedCalculations() {
  return request('/saved-calculations');
}

export function postSavedCalculation(payload: unknown) {
  return request('/saved-calculations', { method: 'POST', body: JSON.stringify(payload) });
}

export function deleteSavedCalculation(id: string) {
  return request(`/saved-calculations/${id}`, { method: 'DELETE' });
}

// ExchangeRate API – USD->TRY kuru
export async function getUsdTryRate(): Promise<number> {
  const KEY = '955af145bf3c2926aa413512'
  const url = `https://v6.exchangerate-api.com/v6/${KEY}/latest/USD`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Kur alınamadı')
  const data = await res.json().catch(() => null as any)
  const rate = data?.conversion_rates?.TRY
  if (typeof rate !== 'number') throw new Error('TRY kuru bulunamadı')
  return rate
}

// Yahoo Finance XAUUSD=X – ana fiyatı çek
export async function getXauUsd(): Promise<number> {
  if (!apiEnabled) throw new Error('API disabled')
  const data = await request('/xauusd') as any
  if (typeof data?.price !== 'number') throw new Error('Ons fiyatı alınamadı')
  return data.price
}

export async function getRates(): Promise<{ usdtry: number; xauusd: number; ts: number; cached: boolean }> {
  if (!apiEnabled) throw new Error('API disabled')
  return request('/rates') as any
}


