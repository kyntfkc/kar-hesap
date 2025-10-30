import { useState, useEffect, useCallback } from 'react'
import { ProductInfo, GoldInfo, Expenses, Platform, ProfitResult, SavedCalculation } from '../types'
import { calculateAllPlatforms, calculateStandardSalePrice } from '../utils/calculations'
import { apiEnabled, postCalculate, postSync, getSavedCalculations, postSavedCalculation, deleteSavedCalculation } from '../utils/api'
import { TrendingUp, Loader2, Copy, Check, Settings } from 'lucide-react'
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
  { name: 'Astarlı Ürün', commissionRate: 22, salePrice: productGram * goldPrice * 1.2, targetProfitRate: 30 },
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
      // Eğer hiç platform yoksa veya Standart yoksa varsayılan oluştur
      if (parsed.length === 0 || !parsed.some((p: Platform) => p.name === 'Standart')) {
        const savedProductInfo = localStorage.getItem('productInfo')
        const savedGoldInfo = localStorage.getItem('goldInfo')
        const productGram = savedProductInfo ? JSON.parse(savedProductInfo).productGram : defaultProductInfo.productGram
        const goldPrice = savedGoldInfo ? JSON.parse(savedGoldInfo).goldPrice : defaultGoldInfo.goldPrice
        return getDefaultPlatforms(productGram, goldPrice)
      }
      // Astarlı Ürün yoksa ekle
      if (!parsed.some((p: Platform) => p.name === 'Astarlı Ürün')) {
        const savedProductInfo = localStorage.getItem('productInfo')
        const savedGoldInfo = localStorage.getItem('goldInfo')
        const productGram = savedProductInfo ? JSON.parse(savedProductInfo).productGram : defaultProductInfo.productGram
        const goldPrice = savedGoldInfo ? JSON.parse(savedGoldInfo).goldPrice : defaultGoldInfo.goldPrice
        return [
          ...parsed,
          { name: 'Astarlı Ürün', commissionRate: 22, salePrice: productGram * goldPrice * 1.2, targetProfitRate: 30 },
        ]
      }
      return parsed
    }
    return getDefaultPlatforms(defaultProductInfo.productGram, defaultGoldInfo.goldPrice)
  })
  const [results, setResults] = useState<ProfitResult[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>(() => {
    const saved = localStorage.getItem('savedCalculations')
    return saved ? JSON.parse(saved) : []
  })

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

  // Auto-calculate with debounce
  useEffect(() => {
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

  const copyResultsToClipboard = async () => {
    if (results.length === 0) return
    
    const text = results.map(r => 
      `${r.platform}\t${r.salePrice.toFixed(2)} TL\t${r.commissionRate.toFixed(2)}%\t${r.netProfit.toFixed(2)} TL\t${r.profitRate.toFixed(2)}%`
    ).join('\n')
    
    const header = 'Senaryo\tSatış Tutarı\tKomisyon %\tNet Kazanç\tKâr %\n'
    
    try {
      await navigator.clipboard.writeText(header + text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Kopyalama hatası:', err)
    }
  }

  const handleSaveCurrentResults = () => {
    if (!results.length || !saveName.trim()) return
    const entry: SavedCalculation = {
      id: `${Date.now()}`,
      name: saveName.trim(),
      createdAt: Date.now(),
      results,
    }
    const updated = [entry, ...savedCalculations]
    setSavedCalculations(updated)
    localStorage.setItem('savedCalculations', JSON.stringify(updated))
    setSaveName('')
    // fire-and-forget sync immediately after save
    if (apiEnabled) {
      postSavedCalculation(entry).catch(() => {})
    }
  }

  const handleDeleteSaved = (id: string) => {
    const updated = savedCalculations.filter(s => s.id !== id)
    setSavedCalculations(updated)
    localStorage.setItem('savedCalculations', JSON.stringify(updated))
    if (apiEnabled) deleteSavedCalculation(id).catch(() => {})
  }

  const handleSaveSingleScenario = (result: ProfitResult) => {
    const name = saveName.trim() || (typeof window !== 'undefined' ? window.prompt('Ürün adı') || '' : '')
    if (!name) return
    const entry: SavedCalculation = {
      id: `${Date.now()}`,
      name,
      createdAt: Date.now(),
      results: [result],
    }
    const updated = [entry, ...savedCalculations]
    setSavedCalculations(updated)
    localStorage.setItem('savedCalculations', JSON.stringify(updated))
    if (apiEnabled) postSavedCalculation(entry).catch(() => {})
  }

  // En yüksek kâr oranına sahip senaryo "En İyi Senaryo"
  const bestScenario = results.length > 0 
    ? results.reduce((best, current) => current.profitRate > best.profitRate ? current : best)
    : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-[calc(100vh-180px)]">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 overflow-y-auto hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 ring-1 ring-slate-200/50">
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
          className="w-full mt-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:from-blue-400 disabled:via-indigo-400 disabled:to-purple-400 text-white font-bold py-3.5 px-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
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

      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 overflow-y-auto hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 ring-1 ring-slate-200/50">
        {isCalculating ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-sm text-slate-600 font-medium">Hesaplanıyor...</p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Hesaplama Sonuçları</h2>
                <p className="text-xs text-slate-500 font-medium">{results.length} senaryo karşılaştırıldı</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={saveName}
                  onChange={e=>setSaveName(e.target.value)}
                  placeholder="Ürün adı"
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  onClick={handleSaveCurrentResults}
                  disabled={!saveName.trim()}
                  className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-blue-600 disabled:bg-blue-300"
                >Kaydet</button>
                <button
                  onClick={copyResultsToClipboard}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all duration-200 hover:scale-110"
                  title="Sonuçları kopyala"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            
            {bestScenario && (
              <div className="mb-5">
                <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 rounded-xl border border-blue-200/60 shadow-sm ring-1 ring-blue-100/50">
                  <div className="text-xs text-blue-700 font-semibold mb-1 uppercase tracking-wide">En İyi Senaryo</div>
                  <div className="text-lg font-bold text-blue-900 mb-0.5">{bestScenario.platform}</div>
                  <div className="text-xs text-blue-600 font-medium">{bestScenario.profitRate.toFixed(1)}% kâr</div>
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
      <SettingsModal open={showSettings} initial={appSettings} onClose={()=>setShowSettings(false)} onSave={handleSaveSettings} />

      {/* Floating Settings Button */}
      <button
        onClick={()=>setShowSettings(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-2xl shadow-indigo-500/30 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-700 hover:via-blue-700 hover:to-purple-700 ring-4 ring-indigo-500/10 hover:scale-105 transition-all"
        title="Ayarlar"
      >
        <Settings className="w-4 h-4 text-white" /> Ayarlar
      </button>

      {/* Saved calculations table */}
      {savedCalculations.length > 0 && (
        <div className="mt-6 col-span-1 lg:col-span-2 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 ring-1 ring-slate-200/50">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-slate-900">Kayıtlı Sonuçlar</h3>
            <p className="text-xs text-slate-500">Ürün adıyla kaydettiğiniz karşılaştırmalar</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-slate-200/80 bg-slate-50">
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase">Ürün</th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase">Tarih</th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase">En İyi Senaryo</th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 uppercase">Kâr %</th>
                  <th className="px-2 py-2 text-right text-xs font-bold text-slate-700 uppercase">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedCalculations.map(sc => {
                  const best = sc.results.reduce((b, c)=> c.profitRate > b.profitRate ? c : b)
                  return (
                    <tr key={sc.id} className="hover:bg-blue-50/40">
                      <td className="px-2 py-2 text-sm font-semibold text-slate-900">{sc.name}</td>
                      <td className="px-2 py-2 text-sm text-slate-700">{new Date(sc.createdAt).toLocaleString('tr-TR')}</td>
                      <td className="px-2 py-2 text-sm text-slate-900">{best.platform}</td>
                      <td className="px-2 py-2 text-sm font-bold text-slate-900">{best.profitRate.toFixed(1)}%</td>
                      <td className="px-2 py-2 text-right">
                        <button onClick={()=>handleDeleteSaved(sc.id)} className="text-xs px-2 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50">Sil</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfitCalculator
