import { useEffect, useMemo, useState } from 'react'
import { formatNumber } from '../utils/format'

function readInitialGoldPrice(): number {
  try {
    const saved = localStorage.getItem('ecommerceGoldPrice')
    if (saved) {
      const n = Number(saved)
      return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
    }
    const raw = localStorage.getItem('goldInfo')
    if (!raw) return 0
    const parsed = JSON.parse(raw)
    const n = Number(parsed?.goldPrice)
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
  } catch {
    return 0
  }
}

export default function EcommerceMilyemCalculator() {
  const [goldPrice, setGoldPrice] = useState<number>(() => readInitialGoldPrice())
  const [goldPriceInput, setGoldPriceInput] = useState<string>('')
  const [netProfitTl, setNetProfitTl] = useState<number>(0)
  const [profitInput, setProfitInput] = useState<string>('')

  useEffect(() => {
    localStorage.setItem('ecommerceGoldPrice', String(goldPrice || 0))
  }, [goldPrice])

  const milem = useMemo(() => {
    if (!goldPrice || goldPrice <= 0) return 0
    return (netProfitTl / goldPrice) * 1000
  }, [netProfitTl, goldPrice])

  return (
    <div className="max-w-[480px] mx-auto px-3 sm:px-0 pb-24">
      <div className="card p-4 sm:p-6 hover:shadow-2xl hover:shadow-sky-400/20 transition-all duration-300">
        <h2 className="text-xl font-bold text-slate-900 mb-4">E-ticaret Milyemi</h2>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-sky-50 to-teal-50 rounded-xl p-4 border border-sky-200/60">
            <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1.5">Altın Kuru</div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={goldPriceInput !== '' ? goldPriceInput : (goldPrice === 0 ? '' : goldPrice.toLocaleString('tr-TR'))}
                onChange={(e) => {
                  const raw = e.target.value
                  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
                  setGoldPriceInput(raw)
                  const num = parseFloat(cleaned)
                  setGoldPrice(!Number.isFinite(num) ? 0 : Math.max(0, Math.round(num)))
                }}
                onBlur={() => setGoldPriceInput('')}
                className="w-full px-3 py-2.5 pr-16 text-sm border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 bg-white transition-all font-semibold text-slate-900 hover:border-sky-400 shadow-sm"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">TL/gr</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider">
              Net Kâr (TL)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={profitInput}
                onChange={(e) => {
                  const raw = e.target.value
                  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
                  setProfitInput(raw)
                  const num = parseFloat(cleaned)
                  setNetProfitTl(!Number.isFinite(num) ? 0 : num)
                }}
                onBlur={() => setProfitInput(netProfitTl === 0 ? '' : netProfitTl.toLocaleString('tr-TR'))}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-300/70 rounded-xl focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 bg-white transition-all font-medium text-slate-900 hover:border-sky-400 shadow-sm"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">TL</span>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 ring-1 ring-slate-200/50 overflow-hidden">
            <div className="p-4">
              <div className="text-xs text-slate-600 font-semibold mb-2">Sonuç</div>
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-sky-700 to-teal-700">
                  {goldPrice > 0 ? milem.toFixed(2).replace('.', ',') : '-'}
                </div>
                <div className="text-xs font-semibold text-slate-600">milyem</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

