import { useState, useEffect } from 'react'
import { VariantReference, VariantGroup, VariantPriceResult } from '../types'
import { calculateAllVariantPrices } from '../utils/calculations'
import { formatNumber } from '../utils/format'
import { TrendingUp, Loader2 } from 'lucide-react'
import VariantPriceTable from './VariantPriceTable'
import { cacheSetJson } from '../utils/appSnapshot'

const defaultVariantReference: VariantReference = {
  gram: 1.0,
  price: 0
}

const defaultVariantGroups: VariantGroup[] = [
  { name: 'Küçük Boy Grubu', minSize: 10, maxSize: 13, discountPercent: -10 },
  { name: 'Orta Boy Grubu', minSize: 14, maxSize: 17, discountPercent: 0 },
  { name: 'Büyük Boy Grubu', minSize: 18, maxSize: 20, discountPercent: 15 }
]

function VariantPriceCalculator() {
  const [variantReference, setVariantReference] = useState<VariantReference>(() => {
    const saved = localStorage.getItem('variantReference')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return defaultVariantReference
      }
    }
    return defaultVariantReference
  })

  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>(() => {
    const saved = localStorage.getItem('variantGroups')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return defaultVariantGroups
      }
    }
    return defaultVariantGroups
  })
  const [results, setResults] = useState<VariantPriceResult[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [gramInput, setGramInput] = useState<string>('')

  // İlk yüklemede gram input'u kaydedilen değerle doldur
  useEffect(() => {
    setGramInput(variantReference.gram === 0 ? '' : variantReference.gram.toFixed(2).replace('.', ','))
  }, [])

  // Auto-save to localStorage (+ online sync)
  useEffect(() => {
    cacheSetJson('variantReference', variantReference)
  }, [variantReference])

  useEffect(() => {
    cacheSetJson('variantGroups', variantGroups)
  }, [variantGroups])

  const updateGroupDiscount = (index: number, discountPercent: number) => {
    setVariantGroups(prev =>
      prev.map((g, i) => (i === index ? { ...g, discountPercent } : g))
    )
  }

  const getGroupLabel = (discountPercent: number) => {
    if (discountPercent < 0) return `%${Math.abs(discountPercent)} İndirim`
    if (discountPercent > 0) return `%${discountPercent} Ek Ücret`
    return 'Baz Fiyat'
  }

  const getGroupLabelClass = (discountPercent: number) => {
    if (discountPercent < 0) return 'text-rose-500'
    if (discountPercent > 0) return 'text-emerald-600'
    return 'text-slate-700'
  }

  // Referans fiyatı otomatik hesapla (gram ve altın kuru varsa)
  useEffect(() => {
    if (variantReference.price === 0 && variantReference.gram > 0) {
      // Altın kuru bilgisini localStorage'dan al
      try {
        const savedGoldInfo = localStorage.getItem('goldInfo')
        if (savedGoldInfo) {
          const goldInfo = JSON.parse(savedGoldInfo)
          if (goldInfo.goldPrice) {
            // Basit hesaplama: gram × altın kuru × 1.2 (yaklaşık)
            const estimatedPrice = Math.round(variantReference.gram * goldInfo.goldPrice * 1.2)
            setVariantReference(prev => ({ ...prev, price: estimatedPrice }))
          }
        }
      } catch {
        // Hata durumunda bir şey yapma
      }
    }
  }, [variantReference.gram])

  const handleCalculate = () => {
    if (variantReference.price === 0) {
      alert('Lütfen referans fiyatı girin')
      return
    }

    setIsCalculating(true)
    setTimeout(() => {
      const calculatedResults = calculateAllVariantPrices(variantReference, variantGroups)
      setResults(calculatedResults)
      setIsCalculating(false)
      setHasCalculated(true)
    }, 100)
  }

  const updateReference = (field: keyof VariantReference, value: number) => {
    setVariantReference(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 sm:gap-5 px-3 sm:px-0 pb-24">
      {/* Sol Kolon: Referans Ürün Girişi */}
      <div className="card p-4 sm:p-6 hover:shadow-2xl hover:shadow-emerald-400/20 transition-all duration-300">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Referans Ürün</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider">
              Gram
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={gramInput}
                onChange={(e) => {
                  const inputValue = e.target.value
                  const normalizedValue = inputValue.replace(',', '.')
                  if (normalizedValue === '' || /^(\d+)?([.,]\d*)?$/.test(normalizedValue)) {
                    setGramInput(inputValue)
                    if (normalizedValue === '' || normalizedValue === '.') {
                      updateReference('gram', 0)
                    } else {
                      const numValue = parseFloat(normalizedValue)
                      if (!isNaN(numValue)) {
                        const roundedValue = Math.round(numValue * 100) / 100
                        updateReference('gram', roundedValue)
                      }
                    }
                  }
                }}
                onBlur={() => {
                  const num = variantReference.gram
                  setGramInput(num === 0 ? '' : num.toFixed(2).replace('.', ','))
                }}
                className="w-full px-3 py-2.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-white transition-all font-medium text-slate-900 hover:border-emerald-400 shadow-sm"
                placeholder="1,00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">Gr</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider">
              Fiyat
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={variantReference.price === 0 ? '' : variantReference.price.toLocaleString('tr-TR')}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
                  if (raw === '' || raw === '.') {
                    updateReference('price', 0)
                  } else {
                    const num = parseFloat(raw)
                    if (!isNaN(num)) {
                      updateReference('price', Math.round(num))
                    }
                  }
                }}
                className="w-full px-3 py-2.5 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-white transition-all font-medium text-slate-900 hover:border-emerald-400 shadow-sm"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">TL</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/50">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Ölçü Grupları</h3>
            <p className="text-xs text-slate-500 mb-3">Negatif = indirim, 0 = baz, pozitif = ek ücret</p>
            <div className="space-y-3">
              {variantGroups.map((group, index) => (
                <div key={index} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700 shrink-0">
                    {group.name.replace(' Boy Grubu', '')} ({group.minSize}-{group.maxSize}):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={-100}
                      max={100}
                      step={1}
                      value={group.discountPercent === 0 ? '' : group.discountPercent}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '') {
                          updateGroupDiscount(index, 0)
                          return
                        }
                        const n = parseInt(v, 10)
                        if (!isNaN(n)) updateGroupDiscount(index, Math.max(-100, Math.min(100, n)))
                      }}
                      placeholder="0"
                      className="w-16 px-2 py-1.5 text-xs text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-white font-semibold"
                    />
                    <span className="text-xs text-slate-500">%</span>
                    <span className={`text-xs font-semibold min-w-[4rem] ${getGroupLabelClass(group.discountPercent)}`}>
                      {getGroupLabel(group.discountPercent)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={isCalculating || variantReference.price === 0}
            className="w-full mt-6 !h-11 text-white !text-sm disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 transition-all"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Hesaplanıyor...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Hesapla
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sağ Kolon: Sonuçlar */}
      <div className="card p-4 sm:p-6 overflow-y-auto overflow-x-hidden hover:shadow-2xl hover:shadow-emerald-400/20 transition-all duration-300">
        {isCalculating ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <p className="text-sm text-slate-600 font-medium">Hesaplanıyor...</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="mb-3 sm:mb-5">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Varyant Fiyat Sonuçları</h2>
            </div>
            <VariantPriceTable results={results} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-4 shadow-lg shadow-emerald-200/30">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Sonuçları görmek için hesapla butonuna tıklayın</p>
            <p className="text-xs text-slate-400 mt-1">Referans ürün bilgilerini girin ve hesaplayın</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VariantPriceCalculator
