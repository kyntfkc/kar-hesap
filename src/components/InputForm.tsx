import { useState, useEffect } from 'react'
import { ProductInfo, GoldInfo, Expenses, Platform } from '../types'
import { 
  calculatePureGoldGram, 
  calculateProductAmount, 
  calculatePurchasePrice 
} from '../utils/calculations'
import { calculateStandardSalePrice } from '../utils/calculations'
import { Plus, X } from 'lucide-react'

interface InputFormProps {
  productInfo: ProductInfo
  goldInfo: GoldInfo
  expenses: Expenses
  platforms: Platform[]
  onProductInfoChange: (info: ProductInfo) => void
  onGoldInfoChange: (info: GoldInfo) => void
  onExpensesChange: (expenses: Expenses) => void
  onPlatformsChange: (platforms: Platform[]) => void
}

const calculateDefaultSalePrice = (productAmount: number): number => {
  // Varsayılan olarak ürün tutarının 2 katı ve tam sayıya yuvarlanır
  return Math.round(productAmount * 2)
}


function InputForm({
  productInfo,
  goldInfo,
  expenses,
  platforms,
  onProductInfoChange,
  onGoldInfoChange,
  onExpensesChange,
  onPlatformsChange,
}: InputFormProps) {
  const [expandedSections, setExpandedSections] = useState({
    labor: false,
    expenses: false,
    extras: false,
  })
  
  const [productGramInput, setProductGramInput] = useState<string>('')
  const [goldPriceInput, setGoldPriceInput] = useState<string>('')
  const [lengthOption, setLengthOption] = useState<'none' | '50' | '60'>('none')

  const pureGoldGram = calculatePureGoldGram(productInfo)
  
  const productAmount = calculateProductAmount(pureGoldGram, goldInfo.goldPrice)
  
  const purchasePrice = calculatePurchasePrice(productAmount)

  // Altın kuru işlemleri ayrı kartta
  
  useEffect(() => {
    const updatedProductInfo = {
      ...productInfo,
      pureGoldGram: pureGoldGram
    }
    // Hassasiyet için epsilon değeri kullan (0.00001)
    const epsilon = 0.00001
    if (Math.abs(updatedProductInfo.pureGoldGram - productInfo.pureGoldGram) > epsilon) {
      onProductInfoChange(updatedProductInfo)
    }
  }, [productInfo.productGram, productInfo.laborMillem, productInfo.laserCuttingEnabled, productInfo.laserCuttingMillem, productInfo.pureGoldGram, pureGoldGram])

  useEffect(() => {
    const updatedGoldInfo = {
      ...goldInfo,
      productAmount: productAmount,
      purchasePrice: purchasePrice
    }
    // Hassasiyet için epsilon değeri kullan (0.01 TL için yeterli)
    const epsilon = 0.01
    if (
      Math.abs(updatedGoldInfo.productAmount - goldInfo.productAmount) > epsilon ||
      Math.abs(updatedGoldInfo.purchasePrice - goldInfo.purchasePrice) > epsilon
    ) {
      onGoldInfoChange(updatedGoldInfo)
    }
  }, [productAmount, purchasePrice, goldInfo.productAmount, goldInfo.purchasePrice])

  const toggleSection = (section: 'labor' | 'expenses' | 'extras') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const updateProductInfo = (field: keyof ProductInfo, value: number | boolean) => {
    onProductInfoChange({ ...productInfo, [field]: value })
  }

  const updateGoldInfo = (field: keyof GoldInfo, value: number) => {
    onGoldInfoChange({ ...goldInfo, [field]: value })
  }

  const updateExpenses = (field: keyof Expenses, value: number) => {
    onExpensesChange({ ...expenses, [field]: value })
  }

  // Uzun zincir farkı kaldırıldı

  const handleSpecialPackagingToggle = () => {
    if (expenses.specialPackaging === 0) {
      // Ayarlardan oku; yoksa 150
      try {
        const saved = localStorage.getItem('appSettings')
        const val = saved ? JSON.parse(saved).defaultExtraCost : 150
        updateExpenses('specialPackaging', typeof val === 'number' ? val : 150)
      } catch {
        updateExpenses('specialPackaging', 150)
      }
    } else {
      updateExpenses('specialPackaging', 0)
    }
  }

  const updatePlatform = (index: number, field: keyof Platform, value: string | number) => {
    const updated = [...platforms]
    updated[index] = { ...updated[index], [field]: value }
    onPlatformsChange(updated)
  }

  const addPlatform = () => {
    // Senaryo numaralarını bul
    const scenarioNumbers = platforms
      .map(p => {
        const match = p.name.match(/Senaryo (\d+)/)
        return match ? parseInt(match[1]) : 0
      })
      .filter(n => n > 0)
    
    const nextNumber = scenarioNumbers.length > 0 
      ? Math.max(...scenarioNumbers) + 1 
      : platforms.some(p => p.name === 'Standart') ? 1 : 1
    
    // Standart senaryonun mevcut satış fiyatını kopyala; yoksa default kullan
    const std = platforms.find(p => p.name === 'Standart')
    const initialSale = std?.salePrice ?? calculateDefaultSalePrice(goldInfo.productAmount)
    onPlatformsChange([
      ...platforms,
      { name: `Senaryo ${nextNumber}`, commissionRate: 22, salePrice: Math.round(initialSale) },
    ])
  }

  const addLinedProduct = () => {
    // Eğer zaten mevcutsa ekleme
    if (platforms.some(p => p.name === 'Astarlı Ürün')) return
    const sale = calculateStandardSalePrice(
      productInfo,
      goldInfo,
      expenses,
      22,
      20
    )
    onPlatformsChange([
      ...platforms,
      { name: 'Astarlı Ürün', commissionRate: 22, salePrice: sale, targetProfitRate: 20 },
    ])
  }

  const removePlatform = (index: number) => {
    const next = platforms.filter((_, i) => i !== index)
    if (next.length === 0) {
      // En az bir senaryo olmalı: otomatik Standart ile yeniden başlat
      onPlatformsChange([
        { name: 'Standart', commissionRate: 22, salePrice: calculateDefaultSalePrice(goldInfo.productAmount), targetProfitRate: 15 },
      ])
    } else {
      onPlatformsChange(next)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider">Ürün Gram</label>
          {/* Ürün gram + uzunluk butonları aynı satır */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={productGramInput !== '' ? productGramInput : (productInfo.productGram === 0 ? '' : productInfo.productGram.toFixed(2).replace('.', ','))}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    const normalizedValue = inputValue.replace(',', '.')
                    if (normalizedValue === '' || /^(\d+)?([.,]\d*)?$/.test(normalizedValue)) {
                      setProductGramInput(inputValue)
                      if (lengthOption !== 'none') setLengthOption('none')
                      if (normalizedValue === '' || normalizedValue === '.') {
                        updateProductInfo('productGram', 0)
                      } else {
                        const numValue = parseFloat(normalizedValue)
                        if (!isNaN(numValue)) {
                          // Tutarlı yuvarlama: 3 ondalık basamağa yuvarla
                          const roundedValue = Math.round(numValue * 1000) / 1000
                          updateProductInfo('productGram', roundedValue)
                        }
                      }
                    }
                  }}
                  onBlur={() => setProductGramInput('')}
                  className="w-32 px-3 py-2.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white transition-all font-medium text-slate-900 hover:border-amber-400 shadow-sm"
                  placeholder="0,00"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">Gr</span>
              </div>
              <button
              type="button"
              onClick={() => {
                const currentExtra = lengthOption === '50' ? 0.10 : lengthOption === '60' ? 0.30 : 0
                const nextOption = lengthOption === '50' ? 'none' : '50'
                const desiredExtra = nextOption === '50' ? 0.10 : 0
                const base = productInfo.productGram - currentExtra
                // Tutarlı yuvarlama için Math.round kullan
                const nextValue = Math.round((base + desiredExtra) * 1000) / 1000
                updateProductInfo('productGram', nextValue)
                setProductGramInput('')
                setLengthOption(nextOption)
              }}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${lengthOption === '50' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500 shadow-md shadow-amber-500/30' : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'}`}
            >
              50 cm Zincir
            </button>
            <button
              type="button"
              onClick={() => {
                const currentExtra = lengthOption === '50' ? 0.10 : lengthOption === '60' ? 0.30 : 0
                const nextOption = lengthOption === '60' ? 'none' : '60'
                const desiredExtra = nextOption === '60' ? 0.30 : 0
                const base = productInfo.productGram - currentExtra
                // Tutarlı yuvarlama için Math.round kullan
                const nextValue = Math.round((base + desiredExtra) * 1000) / 1000
                updateProductInfo('productGram', nextValue)
                setProductGramInput('')
                setLengthOption(nextOption)
              }}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${lengthOption === '60' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500 shadow-md shadow-amber-500/30' : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'}`}
            >
              60 cm Zincir
            </button>
            </div>

            {/* Ekstra Maliyet Farkı */}
            <div className="flex items-center gap-2 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="text-xs font-medium text-slate-700">Ekstra Maliyet</span>
              <input
                type="number"
                step="0.01"
                value={expenses.specialPackaging}
                onChange={(e) => updateExpenses('specialPackaging', parseFloat(e.target.value) || 0)}
                disabled={expenses.specialPackaging === 0}
                className={`w-20 px-2 py-1 text-xs border border-slate-300/70 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${expenses.specialPackaging === 0 ? 'pointer-events-none opacity-60' : ''}`}
                placeholder="150"
              />
              <span className="text-[11px] text-gray-500">TL</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={expenses.specialPackaging > 0}
                  onChange={handleSpecialPackagingToggle}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-yellow-500"></div>
              </label>
            </div>
          </div>
        </div>

        
      </div>

      <div className="card overflow-hidden bg-gradient-to-br from-slate-50/80 to-white">
        <button
          onClick={() => toggleSection('expenses')}
          className="w-full h-10 px-3 flex items-center justify-between bg-white/90 hover:bg-white transition-all duration-200 group"
        >
          <span className="font-bold text-slate-900 text-sm">İşçilik ve Masraf Kalemleri</span>
          <Plus className={`w-5 h-5 text-gray-700 transition-transform ${expandedSections.expenses ? 'rotate-45' : ''}`} />
        </button>
        {expandedSections.expenses && (
          <div className="p-3 bg-white border-t border-slate-200/80">
            {/* İşçilik Alanı */}
            <div className="mb-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-700 mb-1 font-medium">İşçilik (milyem)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={productInfo.laborMillem}
                    onChange={(e) => updateProductInfo('laborMillem', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white shadow-sm"
                    placeholder="0.050"
                  />
                </div>
                <div className="col-span-2 flex items-end text-[11px] text-slate-500">
                  Gram başına işçilik oranı
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 items-end">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Kargo</label>
                <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={expenses.shipping}
                  onChange={(e) => updateExpenses('shipping', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full px-2 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white text-center shadow-sm"
                />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">TL</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Ambalaj</label>
                <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={expenses.packaging}
                  onChange={(e) => updateExpenses('packaging', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full px-2 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white text-center shadow-sm"
                />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">TL</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Hizmet Bedeli</label>
                <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={expenses.serviceFee}
                  onChange={(e) => updateExpenses('serviceFee', parseFloat(e.target.value) || 0)}
                    className="h-9 w-full px-2 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white text-center shadow-sm"
                />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">TL</span>
              </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">E-ticaret Stopajı (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenses.eCommerceTaxRate === 0 ? '' : expenses.eCommerceTaxRate}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    updateExpenses('eCommerceTaxRate', value)
                  }}
                  className="h-9 w-full px-2 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white text-center shadow-sm"
                  placeholder="1.00"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Senaryolar</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={addPlatform}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-100/60 rounded-lg transition-all"
              title="Yeni senaryo ekle"
            >
              <Plus className="w-3 h-3" />
              Senaryo Ekle
            </button>
            <button
              onClick={addLinedProduct}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100/60 rounded-lg transition-all"
              title="Astarlı Ürün senaryosu ekle"
            >
              <Plus className="w-3 h-3" />
              Astarlı Ürün
            </button>
          </div>
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
                    // Sabit kartların adı değiştirilemez
                    if (platform.name === 'Standart' || platform.name === 'Astarlı Ürün') return
                    updatePlatform(index, 'name', e.target.value)
                  }}
                  disabled={platform.name === 'Standart' || platform.name === 'Astarlı Ürün'}
                  className="w-full px-2 py-1.5 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white font-medium text-slate-900 text-center shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
                  placeholder="Senaryo adı"
                />
                <button
                  onClick={() => removePlatform(index)}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 shadow-sm hover:shadow-md group z-10"
                  title="Senaryoyu sil"
                >
                  <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" strokeWidth={3} />
                </button>
              </div>
              {platform.name === 'Standart' || platform.name === 'Astarlı Ürün' ? (
                <div className="grid grid-cols-2 gap-2">
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
                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">Kâr Oranı (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(platform.targetProfitRate ?? (platform.name === 'Astarlı Ürün' ? 20 : 15)) === 0 ? '' : (platform.targetProfitRate ?? (platform.name === 'Astarlı Ürün' ? 20 : 15))}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                        updatePlatform(index, 'targetProfitRate', value)
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-white text-center font-semibold shadow-sm"
                      placeholder={platform.name === 'Astarlı Ürün' ? '20' : '15'}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Komisyon</label>
                  <input
                    type="number"
                    step="0.1"
                    value={platform.commissionRate}
                    onChange={(e) =>
                      updatePlatform(index, 'commissionRate', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-center font-semibold shadow-sm"
                    placeholder="0"
                  />
                </div>
              )}
                <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">
                  Satış Fiyatı
                  {(platform.name === 'Standart' || platform.name === 'Astarlı Ürün') && (
                    <span className="ml-1 text-xs text-gray-500 font-normal">(Otomatik)</span>
                  )}
                </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={platform.salePrice}
                      onChange={(e) => {
                        if (platform.name === 'Standart' || platform.name === 'Astarlı Ürün') return
                        updatePlatform(index, 'salePrice', parseInt(e.target.value) || 0)
                      }}
                      disabled={platform.name === 'Standart' || platform.name === 'Astarlı Ürün'}
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
  )
}

export default InputForm
