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
      <div className="mb-2">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Altın Kuru</h3>
      </div>
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
            className="w-full px-3 py-2 text-sm border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white transition-all font-medium text-slate-900 hover:border-amber-400 shadow-sm"
            placeholder="0"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">TL</span>
        </div>
      </div>
    </div>
  )
}


