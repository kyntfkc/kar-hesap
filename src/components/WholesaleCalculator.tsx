import { useState, useEffect, useCallback } from 'react'
import { WholesaleInfo, WholesaleExpenses, WholesalePlatform, WholesaleResult, GoldInfo } from '../types'
import { calculateAllWholesalePlatforms, calculateWholesaleStandardSalePrice, calculateWholesalePurchasePrice } from '../utils/calculations'
import { apiEnabled, postCalculate } from '../utils/api'
import { TrendingUp, Loader2, Settings, Store } from 'lucide-react'
import GoldRateCard from './GoldRateCard'
import Toast from './Toast'
import SettingsModal, { AppSettings } from './SettingsModal'
import ResultsTable from './ResultsTable'

const defaultWholesaleInfo: WholesaleInfo = {
  gram: 100,
  goldPrice: 5900,
  purchasePrice: 590000,
}

const defaultWholesaleExpenses: WholesaleExpenses = {
  commission: 0,
  otherExpenses: 0,
}

const getDefaultPlatforms = (gram: number = 100, goldPrice: number = 5900): WholesalePlatform[] => [
  { name: 'Standart', commissionRate: 2, salePrice: Math.round(gram * goldPrice * 1.07), targetProfitRate: 5 },
]

interface WholesaleCalculatorProps {
  onNavigateToRetail?: () => void
}

function WholesaleCalculator({ onNavigateToRetail }: WholesaleCalculatorProps = {}) {
  const defaultAppSettings: AppSettings = {
    defaultProductGram: 0.80,
    defaultGoldPrice: 5900,
    defaultShipping: 120,
    defaultPackaging: 120,
    defaultServiceFee: 20,
    defaultETaxRate: 1.0,
    defaultCommission: 22,
    defaultStandardProfit: 15,
    defaultLinedProfit: 20,
    defaultLaborMillem: 0.050,
    defaultExtraCost: 150,
  }

  const [showSettings, setShowSettings] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('goldAppSettings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return { ...defaultAppSettings, ...parsed }
      } catch {
        return defaultAppSettings
      }
    }
    return defaultAppSettings
  })
  
  const [wholesaleInfo, setWholesaleInfo] = useState<WholesaleInfo>(() => {
    const saved = localStorage.getItem('wholesaleInfo')
    return saved ? JSON.parse(saved) : defaultWholesaleInfo
  })
  
  const [goldInfo, setGoldInfo] = useState<GoldInfo>(() => {
    const saved = localStorage.getItem('goldInfo')
    return saved ? JSON.parse(saved) : { goldPrice: 5900, productAmount: 0, purchasePrice: 0 }
  })
  
  const [expenses, setExpenses] = useState<WholesaleExpenses>(() => {
    const saved = localStorage.getItem('wholesaleExpenses')
    return saved ? JSON.parse(saved) : defaultWholesaleExpenses
  })
  
  const [platforms, setPlatforms] = useState<WholesalePlatform[]>(() => {
    const saved = localStorage.getItem('wholesalePlatforms')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.length === 0 || !parsed.some((p: WholesalePlatform) => p.name === 'Standart')) {
        return getDefaultPlatforms(wholesaleInfo.gram, goldInfo.goldPrice)
      }
      return parsed
    }
    return getDefaultPlatforms(defaultWholesaleInfo.gram, defaultWholesaleInfo.goldPrice)
  })
  
  const [results, setResults] = useState<WholesaleResult[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [toast, setToast] = useState<{message: string; type?: 'success' | 'error' | 'info'} | null>(null)
  const [showExtraCols, setShowExtraCols] = useState(false)

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('wholesaleInfo', JSON.stringify(wholesaleInfo))
  }, [wholesaleInfo])

  useEffect(() => {
    localStorage.setItem('wholesaleExpenses', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('wholesalePlatforms', JSON.stringify(platforms))
  }, [platforms])

  // Altın kuru değiştiğinde wholesaleInfo'yu güncelle
  useEffect(() => {
    setWholesaleInfo(prev => ({
      ...prev,
      goldPrice: goldInfo.goldPrice,
      purchasePrice: calculateWholesalePurchasePrice(prev.gram, goldInfo.goldPrice)
    }))
  }, [goldInfo.goldPrice])

  // Gram veya altın kuru değiştiğinde alış fiyatını güncelle
  useEffect(() => {
    const purchasePrice = calculateWholesalePurchasePrice(wholesaleInfo.gram, wholesaleInfo.goldPrice)
    if (Math.abs(purchasePrice - wholesaleInfo.purchasePrice) > 0.01) {
      setWholesaleInfo(prev => ({ ...prev, purchasePrice }))
    }
  }, [wholesaleInfo.gram, wholesaleInfo.goldPrice])

  // Otomatik senaryoların satış fiyatını güncelle
  useEffect(() => {
    setPlatforms(prevPlatforms => {
      let updated: WholesalePlatform[] | null = null

      const autoNames = ['Standart']
      autoNames.forEach(name => {
        const idx = prevPlatforms.findIndex(p => p.name === name)
        if (idx !== -1) {
          const commissionRate = prevPlatforms[idx].commissionRate || 2
          const targetProfitRate = prevPlatforms[idx].targetProfitRate ?? 5
          const newSalePrice = calculateWholesaleStandardSalePrice(
            wholesaleInfo,
            expenses,
            commissionRate,
            targetProfitRate
          )
          if (Math.abs(prevPlatforms[idx].salePrice - newSalePrice) > 0.01) {
            if (!updated) updated = [...prevPlatforms]
            updated[idx] = { ...updated[idx], salePrice: newSalePrice, targetProfitRate }
          }
        }
      })

      return updated ?? prevPlatforms
    })
  }, [wholesaleInfo, expenses])

  // Auto-calculate only after first manual calculation
  useEffect(() => {
    if (!hasCalculated) return
    setIsCalculating(true)
    const timer = setTimeout(() => {
      const calculatedResults = calculateAllWholesalePlatforms(
        wholesaleInfo,
        expenses,
        platforms
      )
      setResults(calculatedResults)
      setIsCalculating(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [hasCalculated, wholesaleInfo, expenses, platforms])

  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    if (apiEnabled) {
      // API'ye gönder (backend'de toptan satış desteği varsa)
      postCalculate({ wholesaleInfo, expenses, platforms })
        .then((resp: any) => {
          const apiResults = resp.results || []
          const localResults = calculateAllWholesalePlatforms(wholesaleInfo, expenses, platforms)
          const mergedResults = apiResults.map((apiResult: any) => {
            const localResult = localResults.find(lr => lr.platform === apiResult.platform)
            return {
              ...apiResult,
              optimumScore: localResult?.optimumScore ?? apiResult.optimumScore
            }
          })
          setResults(mergedResults.length > 0 ? mergedResults : localResults)
        })
        .catch(() => {
          const calculatedResults = calculateAllWholesalePlatforms(wholesaleInfo, expenses, platforms)
          setResults(calculatedResults)
        })
        .finally(() => { setIsCalculating(false); setHasCalculated(true) })
    } else {
      setTimeout(() => {
        const calculatedResults = calculateAllWholesalePlatforms(wholesaleInfo, expenses, platforms)
        setResults(calculatedResults)
        setIsCalculating(false)
        setHasCalculated(true)
      }, 100)
    }
  }, [wholesaleInfo, expenses, platforms])

  // Keyboard shortcut (Ctrl/Cmd + Enter)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCalculate()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleCalculate])

  const handleSaveSettings = (s: AppSettings, applyNow: boolean) => {
    setAppSettings(s)
    localStorage.setItem('goldAppSettings', JSON.stringify(s))
    if (applyNow) {
      setWholesaleInfo(prev => ({ ...prev, goldPrice: s.defaultGoldPrice }))
      setExpenses(prev => ({ ...prev, commission: 0, otherExpenses: 0 }))
      setPlatforms(prev => prev.map(p => {
        if (p.name === 'Standart') return { ...p, commissionRate: 2, targetProfitRate: 5 }
        return p
      }))
    }
    setShowSettings(false)
  }

  const updateWholesaleInfo = (field: keyof WholesaleInfo, value: number) => {
    setWholesaleInfo(prev => ({ ...prev, [field]: value }))
  }

  const updateExpenses = (field: keyof WholesaleExpenses, value: number) => {
    setExpenses(prev => ({ ...prev, [field]: value }))
  }

  const updatePlatform = (index: number, field: keyof WholesalePlatform, value: string | number) => {
    const updated = [...platforms]
    const platform = updated[index]
    const isAutoPlatform = platform.name === 'Standart'
    
    if (isAutoPlatform && field === 'targetProfitRate') {
      const newTargetProfitRate = typeof value === 'number' ? value : parseFloat(String(value))
      if (!isNaN(newTargetProfitRate)) {
        const newSalePrice = calculateWholesaleStandardSalePrice(
          wholesaleInfo,
          expenses,
          platform.commissionRate || 2,
          newTargetProfitRate
        )
        updated[index] = { ...platform, [field]: newTargetProfitRate, salePrice: newSalePrice }
      } else {
        updated[index] = { ...platform, [field]: value }
      }
    } else {
      updated[index] = { ...platform, [field]: value }
    }
    setPlatforms(updated)
  }

  const addPlatform = () => {
    const scenarioNumbers = platforms
      .map(p => {
        const match = p.name.match(/Senaryo (\d+)/)
        return match ? parseInt(match[1]) : 0
      })
      .filter(n => n > 0)
    
    const nextNumber = scenarioNumbers.length > 0 
      ? Math.max(...scenarioNumbers) + 1 
      : platforms.some(p => p.name === 'Standart') ? 1 : 1
    
    const std = platforms.find(p => p.name === 'Standart')
    const initialSale = std?.salePrice ?? Math.round(wholesaleInfo.gram * wholesaleInfo.goldPrice * 1.07)
    setPlatforms([
      ...platforms,
      { name: `Senaryo ${nextNumber}`, commissionRate: 2, salePrice: Math.round(initialSale) },
    ])
  }

  const removePlatform = (index: number) => {
    const next = platforms.filter((_, i) => i !== index)
    if (next.length === 0) {
      setPlatforms([
        { name: 'Standart', commissionRate: 2, salePrice: Math.round(wholesaleInfo.gram * wholesaleInfo.goldPrice * 1.07), targetProfitRate: 5 },
      ])
    } else {
      setPlatforms(next)
    }
  }

  // ResultsTable için ProfitResult formatına dönüştür
  const convertToProfitResult = (result: WholesaleResult): any => ({
    ...result,
    bankayaYatan: result.salePrice - result.commissionAmount,
    purchasePrice: result.purchasePrice
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 sm:gap-5 px-3 sm:px-0 pb-24">
      {/* Gold card on mobile at very top */}
      <div className="order-1 md:hidden">
        <div className="card p-3 sm:p-4">
          <GoldRateCard goldInfo={goldInfo} onGoldInfoChange={setGoldInfo} />
        </div>
      </div>

      <div className="order-2 md:order-1 card p-4 sm:p-6 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300">
        <div className="space-y-4">
          {/* Gram Input */}
          <div>
            <label className="block text-sm font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider">Gram</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={wholesaleInfo.gram === 0 ? '' : wholesaleInfo.gram}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  updateWholesaleInfo('gram', value)
                }}
                className="w-full px-3 py-2.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white transition-all font-medium text-slate-900 hover:border-amber-400 shadow-sm"
                placeholder="0.00"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">Gr</span>
            </div>
          </div>

          {/* Alış Fiyatı (Otomatik) */}
          <div>
            <label className="block text-sm font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider">Alış Fiyatı</label>
            <div className="px-3 py-2.5 text-sm border border-slate-300/70 rounded-lg bg-slate-50 font-medium text-slate-700">
              {wholesaleInfo.purchasePrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
            </div>
            <p className="text-xs text-slate-500 mt-1">Gram × Altın Kuru (Otomatik)</p>
          </div>

          {/* Masraflar */}
          <div className="card overflow-hidden bg-gradient-to-br from-slate-50/80 to-white">
            <div className="p-3 bg-white border-b border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-sm">Masraflar</h3>
            </div>
            <div className="p-3 bg-white border-t border-slate-200/80">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Diğer Masraflar</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={expenses.otherExpenses === 0 ? '' : expenses.otherExpenses}
                      onChange={(e) => updateExpenses('otherExpenses', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 pr-8 py-2 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white text-center shadow-sm"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">TL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Senaryolar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Senaryolar</h3>
              <button
                onClick={addPlatform}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-100/60 rounded-lg transition-all"
                title="Yeni senaryo ekle"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Senaryo Ekle
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {platforms.map((platform, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-slate-300/70 shadow-sm hover:shadow-md hover:border-slate-400/60 transition-all duration-200 relative ring-1 ring-slate-200/20">
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type="text"
                        value={platform.name}
                        onChange={(e) => {
                          if (platform.name === 'Standart') return
                          updatePlatform(index, 'name', e.target.value)
                        }}
                        disabled={platform.name === 'Standart'}
                        className="w-full px-2 py-1.5 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white font-medium text-slate-900 text-center shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
                        placeholder="Senaryo adı"
                      />
                      <button
                        onClick={() => removePlatform(index)}
                        className="absolute top-1/2 right-1.5 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 shadow-sm hover:shadow-md group z-10"
                        title="Senaryoyu sil"
                      >
                        <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1 font-medium">Komisyon</label>
                      <input
                        type="number"
                        step="0.1"
                        value={platform.commissionRate}
                        onChange={(e) =>
                          updatePlatform(index, 'commissionRate', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white text-center font-semibold shadow-sm"
                        placeholder="0"
                      />
                    </div>
                    {platform.name === 'Standart' && (
                      <div>
                        <label className="block text-xs text-slate-600 mb-1 font-medium">Kâr Oranı (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={(platform.targetProfitRate ?? 5) === 0 ? '' : (platform.targetProfitRate ?? 5)}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            updatePlatform(index, 'targetProfitRate', value)
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white text-center font-semibold shadow-sm"
                          placeholder="5"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-slate-600 mb-1 font-medium">
                        Satış Fiyatı
                        {platform.name === 'Standart' && (
                          <span className="ml-1 text-xs text-gray-500 font-normal">(Otomatik)</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          value={platform.salePrice}
                          onChange={(e) => {
                            if (platform.name === 'Standart') return
                            updatePlatform(index, 'salePrice', parseInt(e.target.value) || 0)
                          }}
                          disabled={platform.name === 'Standart'}
                          className="w-full pr-8 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white text-center font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">TL</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full mt-6 btn-primary !h-11 text-white !text-sm"
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

      {/* Right column: on desktop shows gold + results; on mobile only results (gold rendered above) */}
      <div className="order-3 md:order-2 space-y-3">
        <div className="card p-3 sm:p-4 hidden md:block">
          <GoldRateCard goldInfo={goldInfo} onGoldInfoChange={setGoldInfo} />
        </div>

        <div className="card p-4 sm:p-6 overflow-y-auto overflow-x-hidden hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300">
        {isCalculating ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
            <p className="text-sm text-slate-600 font-medium">Hesaplanıyor...</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="mb-3 sm:mb-5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Hesaplama Sonuçları</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExtraCols(v=>!v)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  title="Komisyon sütununu göster/gizle"
                >{showExtraCols ? 'Detayı Gizle' : 'Detayı Göster'}</button>
              </div>
            </div>
            
          <ResultsTable 
            results={results.map(convertToProfitResult)} 
            showCommission={showExtraCols} 
            showBank={false}
          />
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center mb-4 shadow-lg shadow-amber-200/30">
              <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Sonuçları görmek için hesapla butonuna tıklayın</p>
            <p className="text-xs text-slate-400 mt-1">Girdiğiniz bilgilere göre karşılaştırma yapılacak</p>
          </div>
        )}
      </div>
      </div>
      
      <SettingsModal open={showSettings} initial={appSettings} mode="gold" onClose={()=>setShowSettings(false)} onSave={handleSaveSettings} />

      {/* Floating Buttons */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col gap-2">
        {onNavigateToRetail && (
          <button
            onClick={onNavigateToRetail}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl shadow-amber-500/40 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 ring-4 ring-amber-400/30 hover:scale-105 transition-all"
            title="Takı Satışı"
          >
            <Store className="w-4 h-4 text-white" /> <span className="hidden sm:inline">Takı Satışı</span>
          </button>
        )}
        <button
          onClick={()=>setShowSettings(true)}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl shadow-amber-500/40 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 ring-4 ring-amber-400/30 hover:scale-105 transition-all"
          title="Ayarlar"
        >
          <Settings className="w-4 h-4 text-white" /> <span className="hidden sm:inline">Ayarlar</span>
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  )
}

export default WholesaleCalculator
