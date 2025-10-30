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

export async function postSync(payload: unknown) {
  const r = await fetch(`${BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('API error');
  return r.json();
}

export async function getSavedCalculations() {
  const r = await fetch(`${BASE}/saved-calculations`);
  if (!r.ok) throw new Error('API error');
  return r.json();
}

export async function postSavedCalculation(payload: unknown) {
  const r = await fetch(`${BASE}/saved-calculations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('API error');
  return r.json();
}

export async function deleteSavedCalculation(id: string) {
  const r = await fetch(`${BASE}/saved-calculations/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('API error');
  return r.json();
}


