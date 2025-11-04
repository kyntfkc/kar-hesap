import { useEffect, useState } from 'react'
import { GoldInfo } from '../types'
import { getRates } from '../utils/api'

interface Props {
  goldInfo: GoldInfo
  onGoldInfoChange: (g: GoldInfo) => void
}

export default function GoldRateCard({ goldInfo, onGoldInfoChange }: Props) {
  const [usdtry, setUsdtry] = useState<number | null>(null)
  const [xauusd, setXauusd] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [manualXau, setManualXau] = useState('')
  const [priceInput, setPriceInput] = useState('')

  const update = (field: keyof GoldInfo, value: number) => onGoldInfoChange({ ...goldInfo, [field]: value })

  const refresh = async () => {
    try {
      setLoading(true)
      const r = await getRates()
      setUsdtry(r.usdtry)
      setXauusd(r.xauusd)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const applyGram = () => {
    const xau = xauusd ?? parseFloat(manualXau)
    if (!usdtry || !xau || !isFinite(xau)) return
    const tlPerGram = Math.round((xau / 31.1035) * usdtry)
    update('goldPrice', tlPerGram)
    setPriceInput('')
  }

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Altın Kuru</h3>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
          {usdtry && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 ring-1 ring-slate-200">
              <span className="text-slate-500">USD/TRY</span>
              <b className="text-slate-800">{usdtry.toLocaleString('tr-TR')}</b>
            </span>
          )}
          {xauusd && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 ring-1 ring-slate-200">
              <span className="text-slate-500">XAU/USD</span>
              <b className="text-slate-800">{xauusd.toLocaleString('tr-TR')}</b>
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-600 mb-1 font-medium">TL / Gram</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={priceInput !== '' ? priceInput : (goldInfo.goldPrice === 0 ? '' : goldInfo.goldPrice.toLocaleString('tr-TR'))}
              onChange={(e) => {
                const raw = e.target.value
                const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
                setPriceInput(raw)
                const num = parseFloat(cleaned)
                update('goldPrice', isNaN(num) ? 0 : Math.max(0, Math.round(num)))
              }}
              onBlur={() => setPriceInput('')}
              className="w-full px-3 py-2 text-sm border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400 bg-white transition-all font-medium text-slate-900 hover:border-slate-400 shadow-sm"
              placeholder="0"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">TL</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          {!xauusd && (
            <input type="number" value={manualXau} onChange={e=>setManualXau(e.target.value)} placeholder="Ons (USD)" className="w-full sm:w-32 px-2 py-2 rounded-xl border border-slate-300 text-slate-700" />
          )}
          <div className="flex items-stretch gap-2">
            <button onClick={refresh} className="btn-primary" disabled={loading}>
              {loading ? 'Güncelleniyor…' : 'Kuru Güncelle'}
            </button>
            <button onClick={applyGram} className="btn-outline" disabled={!usdtry || (!xauusd && manualXau.trim()==='')}>Gramı Uygula</button>
          </div>
        </div>
      </div>
    </div>
  )
}


