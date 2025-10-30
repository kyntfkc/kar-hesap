const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
const nf2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatTL(value: number, fraction: 0 | 2 = 0): string {
  if (!isFinite(value)) return '-'
  return (fraction === 2 ? nf2 : nf).format(value) + ' TL'
}

export function formatPercent(value: number): string {
  if (!isFinite(value)) return '-'
  return value.toFixed(1).replace('.', ',') + '%'
}

export function formatNumber(value: number): string {
  if (!isFinite(value)) return '-'
  return nf.format(value)
}


