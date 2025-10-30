import { useState, useEffect, useCallback, useRef } from 'react'
import { ProductInfo, GoldInfo, Expenses, Platform, ProfitResult, SavedCalculation } from '../types'
import { calculateAllPlatforms, calculateStandardSalePrice } from '../utils/calculations'
import { apiEnabled, postCalculate, postSync, getSavedCalculations, postSavedCalculation, deleteSavedCalculation } from '../utils/api'
import { TrendingUp, Loader2, Settings } from 'lucide-react'
import GoldRateCard from './GoldRateCard'
import Toast from './Toast'
import InputForm from './InputForm'
import ResultsTable from './ResultsTable'
import SettingsModal, { AppSettings } from './SettingsModal'

const defaultProductInfo: ProductInfo = {
  productGram: 0.40,
  laborMillem: 0.050,
  pureGoldGram: 0.25,
  laserCuttingEnabled: false,
  laserCuttingMillem: 0.020,
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

const getDefaultPlatforms = (productGram: number = 0.40, goldPrice: number = 5900): Platform[] => [
  { name: 'Standart', commissionRate: 22, salePrice: productGram * goldPrice * 1.2, targetProfitRate: 15 },
]

function ProfitCalculator() {
  const defaultAppSettings: AppSettings = {
    defaultProductGram: 0.40,
    defaultGoldPrice: 5900,
    defaultShipping: 120,
    defaultPackaging: 120,
    defaultServiceFee: 20,
    defaultETaxRate: 1.0,
    defaultCommission: 22,
    defaultStandardProfit: 15,
    defaultLinedProfit: 30,
    defaultLaborMillem: 0.050,
    defaultExtraCost: 150,
  }

  const [showSettings, setShowSettings] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings')
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
  // clipboard state removed
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveModalName, setSaveModalName] = useState('')
  const [saveModalResult, setSaveModalResult] = useState<ProfitResult | null>(null)
  const [saveModalCampaign, setSaveModalCampaign] = useState(false)
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>(() => {
    const saved = localStorage.getItem('savedCalculations')
    return saved ? JSON.parse(saved) : []
  })
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<{message: string; type?: 'success' | 'error' | 'info'} | null>(null)
  const [searchSaved, setSearchSaved] = useState('')
  const [bandFilter, setBandFilter] = useState<'all' | 'lt10' | 'b10_15' | 'b15_20' | 'gte20' | 'campaign'>('all')

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

  // Load persisted saved calculations from backend
  useEffect(() => {
    if (!apiEnabled) return
    getSavedCalculations()
      .then((resp: any) => {
        if (resp && Array.isArray(resp.items)) {
          setSavedCalculations(resp.items)
          localStorage.setItem('savedCalculations', JSON.stringify(resp.items))
        }
      })
      .catch(() => {})
  }, [])

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
        savedCalculations,
      }
      postSync(snapshot).catch(() => {})
    }, 500)
    return () => clearTimeout(timer)
  }, [appSettings, productInfo, goldInfo, expenses, platforms, savedCalculations])

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
    localStorage.setItem('appSettings', JSON.stringify(s))
    if (applyNow) applySettingsToState(s)
    setShowSettings(false)
  }

  // Otomatik senaryoların (Standart ve Astarlı Ürün) satış fiyatını güncelle
  useEffect(() => {
    setPlatforms(prevPlatforms => {
      let updated: Platform[] | null = null

      const autoNames = ['Standart', 'Astarlı Ürün']
      autoNames.forEach(name => {
        const idx = prevPlatforms.findIndex(p => p.name === name)
        if (idx !== -1) {
          const commissionRate = prevPlatforms[idx].commissionRate || 22
          const defaultTarget = name === 'Astarlı Ürün' ? 30 : 15
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
  }, [productInfo, goldInfo, expenses])

  // Auto-calculate with debounce (skip first render -> results empty on initial load)
  const didInitRef = useRef(false)
  useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true
      return
    }
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
  }, [productInfo, goldInfo, expenses, platforms])

  const handleCalculate = useCallback(() => {
    setIsCalculating(true)
    if (apiEnabled) {
      postCalculate({ productInfo, goldInfo, expenses, platforms })
        .then((resp: any) => {
          setResults(resp.results || [])
        })
        .catch(() => {
          const calculatedResults = calculateAllPlatforms(productInfo, goldInfo, expenses, platforms)
          setResults(calculatedResults)
        })
        .finally(() => setIsCalculating(false))
    } else {
      setTimeout(() => {
        const calculatedResults = calculateAllPlatforms(productInfo, goldInfo, expenses, platforms)
        setResults(calculatedResults)
        setIsCalculating(false)
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

  // eski genel kopyalama kaldırıldı

  const handleDeleteSaved = (id: string) => {
    const updated = savedCalculations.filter(s => s.id !== id)
    setSavedCalculations(updated)
    localStorage.setItem('savedCalculations', JSON.stringify(updated))
    if (apiEnabled) deleteSavedCalculation(id).catch(() => {})
  }

  const handleSaveSingleScenario = (result: ProfitResult) => {
    setSaveModalResult(result)
    setSaveModalName('')
    setSaveModalOpen(true)
  }

  const confirmSaveScenario = () => {
    if (!saveModalOpen || !saveModalResult || !saveModalName.trim()) return
    const finalName = saveModalCampaign && !saveModalName.toLowerCase().includes('kampanya')
      ? `${saveModalName} (Kampanya)`
      : saveModalName
    const entry: SavedCalculation = {
      id: `${Date.now()}`,
      name: finalName.trim(),
      createdAt: Date.now(),
      results: [saveModalResult],
    }
    const updated = [entry, ...savedCalculations]
    setSavedCalculations(updated)
    localStorage.setItem('savedCalculations', JSON.stringify(updated))
    if (apiEnabled) postSavedCalculation(entry).catch(() => setToast({ message: 'Kaydetme hatası', type: 'error' }))
    setToast({ message: 'Kaydedildi', type: 'success' })
    setSaveModalOpen(false)
    setSaveModalResult(null)
    setSaveModalName('')
    setSaveModalCampaign(false)
  }

  // Escape ile modal kapatma
  useEffect(() => {
    if (!saveModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSaveModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveModalOpen])

  // Drag & Drop for saved calculations
  const onDragStartSaved = (index: number) => () => setDragIndex(index)
  const onDragOverSaved = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault()
  }
  const onDropSaved = (index: number) => () => {
    if (dragIndex === null || dragIndex === index) return
    const updated = [...savedCalculations]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(index, 0, moved)
    setSavedCalculations(updated)
    localStorage.setItem('savedCalculations', JSON.stringify(updated))
    if (apiEnabled) postSync({ savedCalculations: updated }).catch(() => {})
    setDragIndex(null)
  }

  // En yüksek kâr oranına sahip senaryo "En İyi Senaryo"
  const bestScenario = results.length > 0 
    ? results.reduce((best, current) => current.profitRate > best.profitRate ? current : best)
    : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 px-3 sm:px-0 pb-24">
      <div className="order-2 md:order-1 card p-4 sm:p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
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

      {/* Right column: compact gold card + results stacked (mobile: under input card) */}
      <div className="order-3 md:order-2 space-y-3">
        <div className="card p-3 sm:p-4">
          <GoldRateCard goldInfo={goldInfo} onGoldInfoChange={setGoldInfo} />
        </div>

        <div className="card p-4 sm:p-6 overflow-y-auto overflow-x-hidden hover:shadow-2xl hover:shadow-indigo-300/10 transition-all duration-300">
        {isCalculating ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-sm text-slate-600 font-medium">Hesaplanıyor...</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="mb-3 sm:mb-5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Hesaplama Sonuçları</h2>
                {/* karşılaştırma sayısı metni kaldırıldı */}
              </div>
              {/* kopyalama ikonu kaldırıldı */}
            </div>
            
            
            {bestScenario && (
              <div className="mb-5">
                <div className="relative overflow-hidden rounded-2xl border border-indigo-200/70 ring-1 ring-indigo-100/60 shadow-lg shadow-indigo-500/10">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-indigo-100 to-purple-100" />
                  <div className="relative p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="text-[11px] sm:text-xs text-indigo-700 font-semibold uppercase tracking-wider">En İyi Senaryo</div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold rounded-full bg-white/70 text-indigo-800 border border-indigo-200/70">
                        <svg className="w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 12l5 5L21 5"/></svg>
                        En uygun kâr
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-lg sm:text-xl font-extrabold text-indigo-900">{bestScenario.platform}</div>
                        <div className="mt-1 inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-white/80 text-slate-800 border border-slate-200">
                            Satış: {Math.round(bestScenario.salePrice).toLocaleString('tr-TR')} TL
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-white/80 text-slate-800 border border-slate-200">
                            Net: {Math.round(bestScenario.netProfit).toLocaleString('tr-TR')} TL
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <div className="relative">
                          <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/20 border border-emerald-400/40">
                            <div className="text-[10px] uppercase tracking-wider/loose font-semibold/loose opacity-90">Kâr Oranı</div>
                            <div className="text-2xl sm:text-3xl font-extrabold leading-none">
                              {Math.round(bestScenario.profitRate)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          <ResultsTable results={results} onSaveScenario={handleSaveSingleScenario} />
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Sonuçları görmek için hesapla butonuna tıklayın</p>
            <p className="text-xs text-slate-400 mt-1">Girdiğiniz bilgilere göre karşılaştırma yapılacak</p>
          </div>
        )}
      </div>
      </div>
      <SettingsModal open={showSettings} initial={appSettings} onClose={()=>setShowSettings(false)} onSave={handleSaveSettings} />

      {/* Floating Settings Button */}
      <button
        onClick={()=>setShowSettings(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 inline-flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl shadow-indigo-500/30 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-700 hover:via-blue-700 hover:to-purple-700 ring-4 ring-indigo-500/10 hover:scale-105 transition-all"
        title="Ayarlar"
      >
        <Settings className="w-4 h-4 text-white" /> <span className="hidden sm:inline">Ayarlar</span>
      </button>

      {/* Saved calculations table */}
      {savedCalculations.length > 0 && (
        <div className="order-3 md:order-3 mt-6 col-span-1 md:col-span-2 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-4 sm:p-5 ring-1 ring-slate-200/50 max-w-5xl mx-auto">
          <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Kayıtlı Sonuçlar</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const data = JSON.stringify(savedCalculations, null, 2)
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `kayitli-sonuclar-${new Date().toISOString().slice(0,10)}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                title="Yedeği indir (JSON)"
              >Yedek İndir</button>
              <label className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer" title="Yedek yükle (JSON)">
                Yedek Yükle
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e)=>{
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      try {
                        const json = JSON.parse(String(reader.result))
                        if (Array.isArray(json)) {
                        setSavedCalculations(json)
                          localStorage.setItem('savedCalculations', JSON.stringify(json))
                        if (apiEnabled) postSync({ savedCalculations: json }).catch(()=> setToast({ message: 'Sync hatası', type: 'error' }))
                        setToast({ message: 'Yedek yüklendi', type: 'success' })
                        }
                      } catch {}
                    }
                    reader.readAsText(file)
                    ;(e.target as HTMLInputElement).value = ''
                  }}
                />
              </label>
            </div>
          </div>
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <input
              value={searchSaved}
              onChange={(e)=>setSearchSaved(e.target.value)}
              placeholder="Ürün adı ara..."
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
            />
            <select
              value={bandFilter}
              onChange={(e)=>setBandFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">Tümü</option>
              <option value="lt10">0-10% (kırmızı)</option>
              <option value="b10_15">10-15% (turuncu)</option>
              <option value="b15_20">15-20% (sarı)</option>
              <option value="gte20">20%+ (yeşil)</option>
              <option value="campaign">Kampanya (mavi)</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="sticky top-0 z-10 border-b-2 border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase w-6"> </th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase">Ürün</th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase">Tarih</th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase">Satış</th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase">Net</th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase">Kâr %</th>
                  <th className="px-2 py-2 text-right text-xs font-bold text-slate-700 uppercase">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedCalculations
                  .filter(sc => sc.name.toLowerCase().includes(searchSaved.toLowerCase()))
                  .filter(sc => {
                    const best = sc.results.reduce((b, c)=> c.profitRate > b.profitRate ? c : b)
                    const nameLc = best.platform.toLowerCase()
                    const isCampaign = nameLc.includes('kampanya') || nameLc.includes('kampanyalı') || nameLc.includes('promosyon')
                    const pr = best.profitRate
                    if (bandFilter === 'campaign') return isCampaign
                    if (bandFilter === 'lt10') return pr < 10 && !isCampaign
                    if (bandFilter === 'b10_15') return pr >= 10 && pr < 15 && !isCampaign
                    if (bandFilter === 'b15_20') return pr >= 15 && pr < 20 && !isCampaign
                    if (bandFilter === 'gte20') return pr >= 20 && !isCampaign
                    return true
                  })
                  .map((sc, idx) => {
                  const best = sc.results.reduce((b, c)=> c.profitRate > b.profitRate ? c : b)
                  const nameLc = best.platform.toLowerCase()
                  const isCampaign = nameLc.includes('kampanya') || nameLc.includes('kampanyalı') || nameLc.includes('promosyon')
                  let chipColor = 'bg-gradient-to-r from-rose-400 to-red-500 text-white'
                  const pr = best.profitRate
                  if (isCampaign) chipColor = 'bg-gradient-to-r from-sky-400 to-indigo-400 text-white'
                  else if (pr >= 20) chipColor = 'bg-gradient-to-r from-emerald-400 to-green-500 text-white'
                  else if (pr >= 15) chipColor = 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-slate-900'
                  else if (pr >= 10) chipColor = 'bg-gradient-to-r from-orange-400 to-amber-400 text-white'
                  return (
                    <tr
                      key={sc.id}
                      draggable
                      onDragStart={onDragStartSaved(idx)}
                      onDragOver={onDragOverSaved}
                      onDrop={onDropSaved(idx)}
                      className={`odd:bg-slate-50/60 even:bg-white hover:bg-indigo-50/60 transition-colors ${dragIndex===idx ? 'ring-2 ring-indigo-300 bg-indigo-50' : ''}`}
                    >
                      <td className="px-2 py-2 text-slate-400 cursor-move select-none">≡</td>
                      <td className="px-2 py-2 text-sm font-semibold text-slate-900">
                        <input
                          className="w-full bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none"
                          value={sc.name}
                          onChange={(e)=>{
                            const updated = [...savedCalculations]
                            updated[idx] = { ...sc, name: e.target.value }
                            setSavedCalculations(updated)
                            localStorage.setItem('savedCalculations', JSON.stringify(updated))
                            if (apiEnabled) postSync({ savedCalculations: updated }).catch(()=>{})
                          }}
                        />
                      </td>
                      <td className="px-2 py-2 text-sm text-slate-700">{new Date(sc.createdAt).toLocaleDateString('tr-TR')}</td>
                      <td className="px-2 py-2 text-sm text-slate-900">{best.salePrice.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL</td>
                      <td className="px-2 py-2 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${chipColor}`}>
                          {best.netProfit.toLocaleString('tr-TR', {maximumFractionDigits:0})} TL
                        </span>
                      </td>
                      <td className="px-2 py-2 text-sm font-bold text-slate-900">{Math.round(best.profitRate)}%</td>
                      <td className="px-2 py-2 text-right relative">
                        {confirmDeleteId === sc.id ? (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-slate-300 rounded-md shadow-lg p-2 flex items-center gap-2 z-10">
                            <span className="text-xs text-slate-700">Silinsin mi?</span>
                            <button onClick={() => { handleDeleteSaved(sc.id); setConfirmDeleteId(null); setToast({ message: 'Kayıt silindi', type: 'success' }); }} className="text-xs px-2 py-0.5 rounded-md bg-red-600 text-white">Evet</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-0.5 rounded-md border border-slate-300 text-slate-700">İptal</button>
                          </div>
                        ) : (
                          <button onClick={()=> setConfirmDeleteId(sc.id)} className="text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50">Sil</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save scenario modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setSaveModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Senaryoyu Kaydet</h3>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Ürün adı</label>
            <input
              value={saveModalName}
              onChange={e=>setSaveModalName(e.target.value)}
              placeholder="Örn. minik ikili"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg mb-4"
            />
            <label className="flex items-center gap-2 mb-4 text-sm text-slate-700">
              <input type="checkbox" checked={saveModalCampaign} onChange={e=>setSaveModalCampaign(e.target.checked)} />
              Kampanyalı ürün olarak işaretle
            </label>
            <div className="flex items-center justify-end gap-2">
              <button onClick={()=>setSaveModalOpen(false)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-300">İptal</button>
              <button onClick={confirmSaveScenario} disabled={!saveModalName.trim()} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white disabled:bg-blue-300">Kaydet</button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  )
}

export default ProfitCalculator
