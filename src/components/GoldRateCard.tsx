import { useState } from 'react'
import { GoldInfo } from '../types'

interface Props {
  goldInfo: GoldInfo
  onGoldInfoChange: (g: GoldInfo) => void
}

export default function GoldRateCard({ goldInfo, onGoldInfoChange }: Props) {
  const [priceInput, setPriceInput] = useState('')

  const update = (field: keyof GoldInfo, value: number) => onGoldInfoChange({ ...goldInfo, [field]: value })

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


