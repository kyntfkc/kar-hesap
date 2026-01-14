import { useState, useEffect } from 'react'
import { SilverInfo } from '../types'
import { getUsdTryRate } from '../utils/api'

interface Props {
  silverInfo: SilverInfo
  onSilverInfoChange: (s: SilverInfo) => void
}

export default function SilverRateCard({ silverInfo, onSilverInfoChange }: Props) {
  const [priceInput, setPriceInput] = useState('')
  const [loadingRate, setLoadingRate] = useState(false)

  const update = (field: keyof SilverInfo, value: number) => onSilverInfoChange({ ...silverInfo, [field]: value })

  // USD/TRY kurunu yükle
  useEffect(() => {
    if (silverInfo.usdTryRate === 0) {
      setLoadingRate(true)
      getUsdTryRate()
        .then(rate => {
          update('usdTryRate', rate)
        })
        .catch(() => {
          // Hata durumunda varsayılan değer
          update('usdTryRate', 35)
        })
        .finally(() => setLoadingRate(false))
    }
  }, [])

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-2">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Gümüş Kuru</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-600 mb-1 font-medium">TL / Gram</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={priceInput !== '' ? priceInput : (silverInfo.silverPrice === 0 ? '' : silverInfo.silverPrice.toLocaleString('tr-TR'))}
              onChange={(e) => {
                const raw = e.target.value
                const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
                setPriceInput(raw)
                const num = parseFloat(cleaned)
                update('silverPrice', isNaN(num) ? 0 : Math.max(0, Math.round(num)))
              }}
              onBlur={() => setPriceInput('')}
              className="w-full px-3 py-2 text-sm border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-slate-500/40 focus:border-slate-500 bg-white transition-all font-medium text-slate-900 hover:border-slate-400 shadow-sm"
              placeholder="0"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">TL</span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1 font-medium">USD / TRY</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={loadingRate ? 'Yükleniyor...' : (silverInfo.usdTryRate === 0 ? '' : silverInfo.usdTryRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
              onChange={(e) => {
                const raw = e.target.value
                const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
                const num = parseFloat(cleaned)
                if (!isNaN(num) && num > 0) {
                  update('usdTryRate', num)
                }
              }}
              disabled={loadingRate}
              className="w-full px-3 py-2 text-sm border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-slate-500/40 focus:border-slate-500 bg-white transition-all font-medium text-slate-900 hover:border-slate-400 shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder="0"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">TL</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">İşçilik maliyeti için kullanılır</p>
        </div>
      </div>
    </div>
  )
}
