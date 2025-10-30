const BASE = import.meta.env.VITE_API_BASE_URL;

export const apiEnabled = typeof BASE === 'string' && BASE.length > 0;

export async function postCalculate(payload: unknown) {
  const r = await fetch(`${BASE}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('API error');
  return r.json();
}

export async function postStandardSalePrice(payload: unknown) {
  const r = await fetch(`${BASE}/standard-sale-price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('API error');
  return r.json();
}


