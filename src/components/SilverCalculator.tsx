import { useState, useEffect, useCallback, useRef } from 'react'
import { SilverProductInfo, SilverInfo, SilverExpenses, SilverPlatform, SilverResult } from '../types'
import { calculateAllSilverPlatforms, calculateSilverStandardSalePrice } from '../utils/calculations'
import { apiEnabled, postCalculate, postSync } from '../utils/api'
import { TrendingUp, Loader2, Settings } from 'lucide-react'
import SilverRateCard from './SilverRateCard'
import Toast from './Toast'
import SilverInputForm from './SilverInputForm'
import ResultsTable from './ResultsTable'
import SettingsModal, { AppSettings } from './SettingsModal'
import { getUsdTryRate } from '../utils/api'

const defaultSilverProductInfo: SilverProductInfo = {
  productGram: 0.80,
  laborUsd: 0.50,
  pureSilverGram: 0.74,
  laserCuttingEnabled: false,
  laserCuttingUsd: 0.50,
}

const defaultSilverInfo: SilverInfo = {
  silverPrice: 100,
  usdTryRate: 35,
  productAmount: 74,
  purchasePrice: 91.5,
}

const defaultSilverExpenses: SilverExpenses = {
  shipping: 120,
  packaging: 120,
  eCommerceTax: 0,
  eCommerceTaxRate: 1.00,
  serviceFee: 20,
  extraChain: 0,
  specialPackaging: 0,
}

const getDefaultSilverPlatforms = (productGram: number = 0.80, silverPrice: number = 100): SilverPlatform[] => [
  { name: 'Standart', commissionRate: 22, salePrice: Math.round(productGram * silverPrice * 1.2), targetProfitRate: 15 },
]

interface SilverCalculatorProps {
  onNavigateToGold?: () => void
}

function SilverCalculator({ onNavigateToGold }: SilverCalculatorProps = {}) {
  const defaultAppSettings: AppSettings = {
    defaultProductGram: 0.80,
    defaultGoldPrice: 5900,
    defaultSilverPrice: 100,
    defaultShipping: 120,
    defaultPackaging: 120,
    defaultServiceFee: 20,
    defaultETaxRate: 1.0,
    defaultCommission: 22,
    defaultStandardProfit: 15,
    defaultLinedProfit: 20,
    defaultLaborMillem: 0.050,
    defaultLaborUsd: 0.50,
    defaultExtraCost: 150,
  }

  const [showSettings, setShowSettings] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('silverAppSettings')
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
  const [productInfo, setProductInfo] = useState<SilverProductInfo>(() => {
    const saved = localStorage.getItem('silverProductInfo')
    return saved ? JSON.parse(saved) : defaultSilverProductInfo
  })
  const [silverInfo, setSilverInfo] = useState<SilverInfo>(() => {
    const saved = localStorage.getItem('silverInfo')
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...defaultSilverInfo, ...parsed }
    }
    return defaultSilverInfo
  })
  const [expenses, setExpenses] = useState<SilverExpenses>(() => {
    const saved = localStorage.getItem('silverExpenses')
    return saved ? JSON.parse(saved) : defaultSilverExpenses
  })
  const [platforms, setPlatforms] = useState<SilverPlatform[]>(() => {
    const saved = localStorage.getItem('silverPlatforms')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.length === 0 || !parsed.some((p: SilverPlatform) => p.name === 'Standart')) {
        const savedProductInfo = localStorage.getItem('silverProductInfo')
        const savedSilverInfo = localStorage.getItem('silverInfo')
        const productGram = savedProductInfo ? JSON.parse(savedProductInfo).productGram : defaultSilverProductInfo.productGram
        const silverPrice = savedSilverInfo ? JSON.parse(savedSilverInfo).silverPrice : defaultSilverInfo.silverPrice
        return getDefaultSilverPlatforms(productGram, silverPrice)
      }
      return parsed
    }
    return getDefaultSilverPlatforms(defaultSilverProductInfo.productGram, defaultSilverInfo.silverPrice)
  })
  const [results, setResults] = useState<SilverResult[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [hasCalculated, setHasCalculated] = useState(false)
  const [toast, setToast] = useState<{message: string; type?: 'success' | 'error' | 'info'} | null>(null)
  const [showExtraCols, setShowExtraCols] = useState(false)

  // USD/TRY kurunu yükle
  useEffect(() => {
    if (silverInfo.usdTryRate === 0 || silverInfo.usdTryRate === defaultSilverInfo.usdTryRate) {
      getUsdTryRate()
        .then(rate => {
          setSilverInfo(prev => ({ ...prev, usdTryRate: rate }))
        })
        .catch(() => {
          // Hata durumunda varsayılan değer
          setSilverInfo(prev => ({ ...prev, usdTryRate: 35 }))
        })
    }
  }, [])

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('silverProductInfo', JSON.stringify(productInfo))
  }, [productInfo])

  useEffect(() => {
    localStorage.setItem('silverInfo', JSON.stringify(silverInfo))
  }, [silverInfo])

  useEffect(() => {
    localStorage.setItem('silverExpenses', JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem('silverPlatforms', JSON.stringify(platforms))
  }, [platforms])

  // Backend sync (debounced) with localStorage snapshot
  useEffect(() => {
    if (!apiEnabled) return
    const timer = setTimeout(() => {
      const snapshot = {
        appSettings,
        silverProductInfo: productInfo,
        silverInfo,
        silverExpenses: expenses,
        silverPlatforms: platforms,
      }
      postSync(snapshot).catch((err) => {
        console.error('Sync error:', err)
      })
    }, 2000)
    return () => clearTimeout(timer)
  }, [appSettings, productInfo, silverInfo, expenses, platforms])

  const applySettingsToState = (s: AppSettings) => {
    setProductInfo(prev => ({ ...prev, productGram: s.defaultProductGram, laborUsd: s.defaultLaborUsd || 0.50 }))
    setSilverInfo(prev => ({ ...prev, silverPrice: s.defaultSilverPrice || 100 }))
    setExpenses(prev => ({ ...prev, shipping: s.defaultShipping, packaging: s.defaultPackaging, serviceFee: s.defaultServiceFee, eCommerceTaxRate: s.defaultETaxRate, specialPackaging: prev.specialPackaging > 0 ? s.defaultExtraCost : 0 }))
    setPlatforms(prev => prev.map(p => {
      if (p.name === 'Standart') return { ...p, commissionRate: s.defaultCommission, targetProfitRate: s.defaultStandardProfit }
      if (p.name === 'Astarlı Ürün') return { ...p, commissionRate: s.defaultCommission, targetProfitRate: s.defaultLinedProfit }
      return p
    }))
  }

  const handleSaveSettings = (s: AppSettings, applyNow: boolean) => {
    setAppSettings(s)
    localStorage.setItem('silverAppSettings', JSON.stringify(s))
    if (applyNow) applySettingsToState(s)
    setShowSettings(false)
  }

  // İlk yüklemede kaydedilmiş ayarları otomatik uygula
  const didApplySettingsOnMountRef = useRef(false)
  useEffect(() => {
    if (didApplySettingsOnMountRef.current) return
    didApplySettingsOnMountRef.current = true
    try {
      const saved = localStorage.getItem('silverAppSettings')
      const s = saved ? { ...defaultAppSettings, ...JSON.parse(saved) } : appSettings
      applySettingsToState(s)
    } catch {
      applySettingsToState(appSettings)
    }
  }, [])

  // Otomatik senaryoların (Standart ve Astarlı Ürün) satış fiyatını güncelle
  useEffect(() => {
    setPlatforms(prevPlatforms => {
      let updated: SilverPlatform[] | null = null

      const autoNames = ['Standart', 'Astarlı Ürün']
      autoNames.forEach(name => {
        const idx = prevPlatforms.findIndex(p => p.name === name)
        if (idx !== -1) {
          const commissionRate = prevPlatforms[idx].commissionRate || 22
          const defaultTarget = name === 'Astarlı Ürün' ? appSettings.defaultLinedProfit : appSettings.defaultStandardProfit
          const targetProfitRate = prevPlatforms[idx].targetProfitRate ?? defaultTarget
          const newSalePrice = calculateSilverStandardSalePrice(
            productInfo,
            silverInfo,
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
  }, [productInfo, silverInfo, expenses, appSettings])

  // Auto-calculate only after first manual calculation
  useEffect(() => {
    if (!hasCalculated) return
    setIsCalculating(true)
    const timer = setTimeout(() => {
      const calculatedResults = calculateAllSilverPlatforms(
        productInfo,
        silverInfo,
        expenses,
        platforms
      )
      setResults(calculatedResults)
      setIsCalculating(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [hasCalculated, productInfo, silverInfo, expenses, platforms])

  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    if (apiEnabled) {
      postCalculate({ silverProductInfo: productInfo, silverInfo, silverExpenses: expenses, silverPlatforms: platforms })
        .then((resp: any) => {
          const apiResults = resp.results || []
          const localResults = calculateAllSilverPlatforms(productInfo, silverInfo, expenses, platforms)
          
          const mergedResults = apiResults.map((apiResult: SilverResult) => {
            const localResult = localResults.find(lr => lr.platform === apiResult.platform)
            return {
              ...apiResult,
              optimumScore: localResult?.optimumScore ?? apiResult.optimumScore
            }
          })
          
          setResults(mergedResults.length > 0 ? mergedResults : localResults)
        })
        .catch(() => {
          const calculatedResults = calculateAllSilverPlatforms(productInfo, silverInfo, expenses, platforms)
          setResults(calculatedResults)
        })
        .finally(() => { setIsCalculating(false); setHasCalculated(true) })
    } else {
      setTimeout(() => {
        const calculatedResults = calculateAllSilverPlatforms(productInfo, silverInfo, expenses, platforms)
        setResults(calculatedResults)
        setIsCalculating(false)
        setHasCalculated(true)
      }, 100)
    }
  }, [productInfo, silverInfo, expenses, platforms])

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

  // ResultsTable için ProfitResult formatına dönüştür
  const convertToProfitResult = (result: SilverResult): any => ({
    ...result,
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 sm:gap-5 px-3 sm:px-0 pb-24">
      {/* Silver card on mobile at very top */}
      <div className="order-1 md:hidden">
        <div className="card p-3 sm:p-4">
          <SilverRateCard silverInfo={silverInfo} onSilverInfoChange={setSilverInfo} />
        </div>
      </div>

      <div className="order-2 md:order-1 card p-4 sm:p-6 hover:shadow-2xl hover:shadow-slate-500/20 transition-all duration-300">
        <SilverInputForm
          productInfo={productInfo}
          silverInfo={silverInfo}
          expenses={expenses}
          platforms={platforms}
          onProductInfoChange={setProductInfo}
          onSilverInfoChange={setSilverInfo}
          onExpensesChange={setExpenses}
          onPlatformsChange={setPlatforms}
        />
        <button
          onClick={handleCalculate}
          disabled={isCalculating}
          className="w-full mt-6 btn-primary !h-11 text-white !text-sm bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700 hover:from-slate-600 hover:via-slate-700 hover:to-slate-800"
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

      {/* Right column: on desktop shows silver + results; on mobile only results (silver rendered above) */}
      <div className="order-3 md:order-2 space-y-3">
        <div className="card p-3 sm:p-4 hidden md:block">
          <SilverRateCard silverInfo={silverInfo} onSilverInfoChange={setSilverInfo} />
        </div>

        <div className="card p-4 sm:p-6 overflow-y-auto overflow-x-hidden hover:shadow-2xl hover:shadow-slate-500/20 transition-all duration-300">
        {isCalculating ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-slate-500 animate-spin mb-4" />
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
                  title="Komisyon ve Bankaya Yatan sütunlarını göster/gizle"
                >{showExtraCols ? 'Detayı Gizle' : 'Detayı Göster'}</button>
              </div>
            </div>
            
          <ResultsTable results={results.map(convertToProfitResult)} showCommission={showExtraCols} showBank={showExtraCols} />
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 shadow-lg shadow-slate-200/30">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Sonuçları görmek için hesapla butonuna tıklayın</p>
            <p className="text-xs text-slate-400 mt-1">Girdiğiniz bilgilere göre karşılaştırma yapılacak</p>
          </div>
        )}
      </div>
      </div>
      <SettingsModal open={showSettings} initial={appSettings} mode="silver" onClose={()=>setShowSettings(false)} onSave={handleSaveSettings} />

      {/* Floating Buttons */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col gap-2">
        {onNavigateToGold && (
          <button
            onClick={onNavigateToGold}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl shadow-amber-500/40 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 ring-4 ring-amber-400/30 hover:scale-105 transition-all"
            title="Altın Hesap"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> <span className="hidden sm:inline">Altın Hesap</span>
          </button>
        )}
        <button
          onClick={()=>setShowSettings(true)}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl shadow-slate-500/40 bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700 hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 ring-4 ring-slate-400/30 hover:scale-105 transition-all"
          title="Ayarlar"
        >
          <Settings className="w-4 h-4 text-white" /> <span className="hidden sm:inline">Ayarlar</span>
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  )
}

export default SilverCalculator
