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
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-4 sm:p-5 ring-1 ring-slate-200/50">
      <div className="mb-2">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Altın Kuru</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 items-end">
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
              className="w-full px-3 py-2 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white transition-all font-medium text-slate-900 hover:border-slate-400 shadow-sm"
              placeholder="0"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">TL</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button onClick={refresh} className="px-2.5 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60" disabled={loading}>
            {loading ? 'Güncelleniyor…' : 'Kuru Güncelle'}
          </button>
          {usdtry && <span className="text-slate-500">USD/TRY: <b>{usdtry.toLocaleString('tr-TR')}</b></span>}
          {xauusd ? (
            <span className="text-slate-500">XAU/USD: <b>{xauusd.toLocaleString('tr-TR')}</b></span>
          ) : (
            <input type="number" value={manualXau} onChange={e=>setManualXau(e.target.value)} placeholder="Ons (USD)" className="w-28 px-2 py-1 rounded-md border border-slate-300" />
          )}
          <button onClick={applyGram} className="px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50" disabled={!usdtry || (!xauusd && manualXau.trim()==='')}>Gramı Uygula</button>
        </div>
      </div>
    </div>
  )
}


