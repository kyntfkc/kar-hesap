import { useState, useEffect, useCallback, useRef } from 'react'
import { ProductInfo, GoldInfo, Expenses, Platform, ProfitResult } from '../types'
import { calculateAllPlatforms, calculateStandardSalePrice } from '../utils/calculations'
import { apiEnabled, postCalculate, postSync } from '../utils/api'
import { TrendingUp, Loader2, Settings } from 'lucide-react'
import GoldRateCard from './GoldRateCard'
import Toast from './Toast'
import InputForm from './InputForm'
import ResultsTable from './ResultsTable'
import SettingsModal, { AppSettings } from './SettingsModal'

const defaultProductInfo: ProductInfo = {
  productGram: 0.80,
  laborMillem: 0.050,
  pureGoldGram: 0.25,
  laserCuttingEnabled: false,
  laserCuttingMillem: 0.100,
}

const defaultGoldInfo: GoldInfo = {
  goldPrice: 5900,
  productAmount: 1498.60,
  purchasePrice: 2497.60,
}

const defaultExpenses: Expenses = {
  shipping: 120,
  packaging: 120,
  eCommerceTax: 0,
  eCommerceTaxRate: 1.00,
  serviceFee: 20,
  extraChain: 0,
  specialPackaging: 0,
}

const getDefaultPlatforms = (productGram: number = 0.80, goldPrice: number = 5900): Platform[] => [
  { name: 'Standart', commissionRate: 22, salePrice: productGram * goldPrice * 1.2, targetProfitRate: 15 },
]

interface ProfitCalculatorProps {
  onNavigateToWholesale?: () => void
}

function ProfitCalculator({ onNavigateToWholesale }: ProfitCalculatorProps = {}) {
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
  const [productInfo, setProductInfo] = useState<ProductInfo>(() => {
    const saved = localStorage.getItem('productInfo')
    return saved ? JSON.parse(saved) : defaultProductInfo
  })
  const [goldInfo, setGoldInfo] = useState<GoldInfo>(() => {
    const saved = localStorage.getItem('goldInfo')
    return saved ? JSON.parse(saved) : defaultGoldInfo
  })
  const [expenses, setExpenses] = useState<Expenses>(() => {
    const saved = localStorage.getItem('expenses')
    return saved ? JSON.parse(saved) : defaultExpenses
  })
  const [platforms, setPlatforms] = useState<Platform[]>(() => {
    const saved = localStorage.getItem('platforms')
    if (saved) {
      const parsed = JSON.parse(saved)
      // Eğer hiç platform yoksa veya Standart yoksa, sadece Standart ile başla
      if (parsed.length === 0 || !parsed.some((p: Platform) => p.name === 'Standart')) {
        const savedProductInfo = localStorage.getItem('productInfo')
        const savedGoldInfo = localStorage.getItem('goldInfo')
        const productGram = savedProductInfo ? JSON.parse(savedProductInfo).productGram : defaultProductInfo.productGram
        const goldPrice = savedGoldInfo ? JSON.parse(savedGoldInfo).goldPrice : defaultGoldInfo.goldPrice
        return getDefaultPlatforms(productGram, goldPrice)
      }
      return parsed
    }
    return getDefaultPlatforms(defaultProductInfo.productGram, defaultGoldInfo.goldPrice)
  })
  const [results, setResults] = useState<ProfitResult[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [toast, setToast] = useState<{message: string; type?: 'success' | 'error' | 'info'} | null>(null)
  const [showExtraCols, setShowExtraCols] = useState(false)

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('productInfo', JSON.stringify(productInfo))
  }, [productInfo])

  useEffect(() => {
    localStorage.setItem('goldInfo', JSON.stringify(goldInfo))
  }, [goldInfo])

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('platforms', JSON.stringify(platforms))
  }, [platforms])

  // Backend sync (debounced) with localStorage snapshot
  useEffect(() => {
    if (!apiEnabled) return
    const timer = setTimeout(() => {
      const snapshot = {
        appSettings,
        productInfo,
        goldInfo,
        expenses,
        platforms,
      }
      postSync(snapshot).catch((err) => {
        console.error('Sync error:', err)
      })
    }, 2000)
    return () => clearTimeout(timer)
  }, [appSettings, productInfo, goldInfo, expenses, platforms])

  const applySettingsToState = (s: AppSettings) => {
    setProductInfo(prev => ({ ...prev, productGram: s.defaultProductGram, laborMillem: s.defaultLaborMillem }))
    setGoldInfo(prev => ({ ...prev, goldPrice: s.defaultGoldPrice }))
    setExpenses(prev => ({ ...prev, shipping: s.defaultShipping, packaging: s.defaultPackaging, serviceFee: s.defaultServiceFee, eCommerceTaxRate: s.defaultETaxRate, specialPackaging: prev.specialPackaging > 0 ? s.defaultExtraCost : 0 }))
    setPlatforms(prev => prev.map(p => {
      if (p.name === 'Standart') return { ...p, commissionRate: s.defaultCommission, targetProfitRate: s.defaultStandardProfit }
      if (p.name === 'Astarlı Ürün') return { ...p, commissionRate: s.defaultCommission, targetProfitRate: s.defaultLinedProfit }
      return p
    }))
  }

  const handleSaveSettings = (s: AppSettings, applyNow: boolean) => {
    setAppSettings(s)
    localStorage.setItem('goldAppSettings', JSON.stringify(s))
    if (applyNow) applySettingsToState(s)
    setShowSettings(false)
  }

  // İlk yüklemede kaydedilmiş ayarları otomatik uygula
  const didApplySettingsOnMountRef = useRef(false)
  useEffect(() => {
    if (didApplySettingsOnMountRef.current) return
    didApplySettingsOnMountRef.current = true
    try {
      const saved = localStorage.getItem('goldAppSettings')
      const s = saved ? { ...defaultAppSettings, ...JSON.parse(saved) } : appSettings
      applySettingsToState(s)
    } catch {
      applySettingsToState(appSettings)
    }
  }, [])

  // Otomatik senaryoların (Standart ve Astarlı Ürün) satış fiyatını güncelle
  useEffect(() => {
    setPlatforms(prevPlatforms => {
      let updated: Platform[] | null = null

      const autoNames = ['Standart', 'Astarlı Ürün']
      autoNames.forEach(name => {
        const idx = prevPlatforms.findIndex(p => p.name === name)
        if (idx !== -1) {
          const commissionRate = prevPlatforms[idx].commissionRate || 22
          const defaultTarget = name === 'Astarlı Ürün' ? appSettings.defaultLinedProfit : appSettings.defaultStandardProfit
          const targetProfitRate = prevPlatforms[idx].targetProfitRate ?? defaultTarget
          const newSalePrice = calculateStandardSalePrice(
            productInfo,
            goldInfo,
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
  }, [productInfo, goldInfo, expenses, appSettings])

  // Auto-calculate only after first manual calculation
  useEffect(() => {
    if (!hasCalculated) return
    setIsCalculating(true)
    const timer = setTimeout(() => {
      const calculatedResults = calculateAllPlatforms(
        productInfo,
        goldInfo,
        expenses,
        platforms
      )
      setResults(calculatedResults)
      setIsCalculating(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [hasCalculated, productInfo, goldInfo, expenses, platforms])

  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    if (apiEnabled) {
      postCalculate({ productInfo, goldInfo, expenses, platforms })
        .then((resp: any) => {
          // API sonuçlarında optimum skor eksikse local hesaplama yap
          const apiResults = resp.results || []
          const localResults = calculateAllPlatforms(productInfo, goldInfo, expenses, platforms)
          
          // API sonuçlarını optimum skorlarla birleştir (platform adına göre eşleştir)
          const mergedResults = apiResults.map((apiResult: ProfitResult) => {
            const localResult = localResults.find(lr => lr.platform === apiResult.platform)
            return {
              ...apiResult,
              optimumScore: localResult?.optimumScore ?? apiResult.optimumScore
            }
          })
          
          setResults(mergedResults.length > 0 ? mergedResults : localResults)
        })
        .catch(() => {
          const calculatedResults = calculateAllPlatforms(productInfo, goldInfo, expenses, platforms)
          setResults(calculatedResults)
        })
        .finally(() => { setIsCalculating(false); setHasCalculated(true) })
    } else {
      setTimeout(() => {
        const calculatedResults = calculateAllPlatforms(productInfo, goldInfo, expenses, platforms)
        setResults(calculatedResults)
        setIsCalculating(false)
        setHasCalculated(true)
      }, 100)
    }
  }, [productInfo, goldInfo, expenses, platforms])

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 sm:gap-5 px-3 sm:px-0 pb-24">
      {/* Gold card on mobile at very top */}
      <div className="order-1 md:hidden">
        <div className="card p-3 sm:p-4">
          <GoldRateCard goldInfo={goldInfo} onGoldInfoChange={setGoldInfo} />
        </div>
      </div>

      <div className="order-2 md:order-1 card p-4 sm:p-6 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-300">
        <InputForm
          productInfo={productInfo}
          goldInfo={goldInfo}
          expenses={expenses}
          platforms={platforms}
          onProductInfoChange={setProductInfo}
          onGoldInfoChange={setGoldInfo}
          onExpensesChange={setExpenses}
          onPlatformsChange={setPlatforms}
        />
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
                {/* karşılaştırma sayısı metni kaldırıldı */}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExtraCols(v=>!v)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  title="Komisyon ve Bankaya Yatan sütunlarını göster/gizle"
                >{showExtraCols ? 'Detayı Gizle' : 'Detayı Göster'}</button>
              </div>
            </div>
            
          <ResultsTable results={results} showCommission={showExtraCols} showBank={showExtraCols} />
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
        {onNavigateToWholesale && (
          <button
            onClick={onNavigateToWholesale}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl shadow-blue-500/40 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 ring-4 ring-blue-400/30 hover:scale-105 transition-all"
            title="Toptan Satış"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> <span className="hidden sm:inline">Toptan Satış</span>
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

export default ProfitCalculator

