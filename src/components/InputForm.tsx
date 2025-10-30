import { useState, useEffect } from 'react'
import { ProductInfo, GoldInfo, Expenses, Platform } from '../types'
import { 
  calculatePureGoldGram, 
  calculateProductAmount, 
  calculatePurchasePrice 
} from '../utils/calculations'
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
    labor: true,
    expenses: false,
    extras: true,
  })
  
  const [productGramInput, setProductGramInput] = useState<string>('')
  const [goldPriceInput, setGoldPriceInput] = useState<string>('')
  const [lengthOption, setLengthOption] = useState<'none' | '50' | '60'>('none')

  const pureGoldGram = calculatePureGoldGram(productInfo)
  
  const productAmount = calculateProductAmount(pureGoldGram, goldInfo.goldPrice)
  
  const purchasePrice = calculatePurchasePrice(
    productAmount,
    productInfo.productGram,
    productInfo.laborMillem,
    goldInfo.goldPrice
  )

  useEffect(() => {
    const updatedProductInfo = {
      ...productInfo,
      pureGoldGram: pureGoldGram
    }
    if (Math.abs(updatedProductInfo.pureGoldGram - productInfo.pureGoldGram) > 0.0001) {
      onProductInfoChange(updatedProductInfo)
    }
  }, [productInfo.productGram, productInfo.laborMillem, productInfo.laserCuttingEnabled, productInfo.laserCuttingMillem, productInfo.pureGoldGram, pureGoldGram])

  useEffect(() => {
    const updatedGoldInfo = {
      ...goldInfo,
      productAmount: productAmount,
      purchasePrice: purchasePrice
    }
    if (
      Math.abs(updatedGoldInfo.productAmount - goldInfo.productAmount) > 0.01 ||
      Math.abs(updatedGoldInfo.purchasePrice - goldInfo.purchasePrice) > 0.01
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
    
    onPlatformsChange([
      ...platforms,
      { name: `Senaryo ${nextNumber}`, commissionRate: 22, salePrice: calculateDefaultSalePrice(goldInfo.productAmount) },
    ])
  }

  const removePlatform = (index: number) => {
    // Standart senaryosu silinemez
    if (platforms[index].name === 'Standart') {
      return
    }
    if (platforms.length > 1) {
      onPlatformsChange(platforms.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-sm font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider">Ürün Gram</label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={productGramInput !== '' ? productGramInput : (productInfo.productGram === 0 ? '' : productInfo.productGram.toString().replace('.', ','))}
              onChange={(e) => {
                const inputValue = e.target.value
                // Türkçe format için virgülü noktaya çevir
                const normalizedValue = inputValue.replace(',', '.')
                
                // Eğer boşsa veya geçerli bir sayı formatıysa (0.80, 0,80, 0.8, vb.)
                if (normalizedValue === '' || /^(\d+)?([.,]\d*)?$/.test(normalizedValue)) {
                  setProductGramInput(inputValue)
                  // Manuel giriş yapılıyorsa uzunluk opsiyonu sıfırlansın
                  if (lengthOption !== 'none') setLengthOption('none')
                  
                  if (normalizedValue === '' || normalizedValue === '.') {
                    updateProductInfo('productGram', 0)
                  } else {
                    const numValue = parseFloat(normalizedValue)
                    if (!isNaN(numValue)) {
                      updateProductInfo('productGram', numValue)
                    }
                  }
                }
              }}
              onBlur={() => {
                // Focus kaybolduğunda input state'ini temizle, değer productInfo'dan gösterilecek
                setProductGramInput('')
              }}
              className="w-full px-2.5 py-2 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white transition-all font-medium text-slate-900 hover:border-slate-400 shadow-sm"
              placeholder="0,00"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">Gr</span>
          </div>
          {/* Uzunluk seçenekleri */}
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const currentExtra = lengthOption === '50' ? 0.10 : lengthOption === '60' ? 0.30 : 0
                const nextOption = lengthOption === '50' ? 'none' : '50'
                const desiredExtra = nextOption === '50' ? 0.10 : 0
                const base = productInfo.productGram - currentExtra
                const nextValue = parseFloat((base + desiredExtra).toFixed(3))
                updateProductInfo('productGram', nextValue)
                setProductGramInput('')
                setLengthOption(nextOption)
              }}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${lengthOption === '50' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}
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
                const nextValue = parseFloat((base + desiredExtra).toFixed(3))
                updateProductInfo('productGram', nextValue)
                setProductGramInput('')
                setLengthOption(nextOption)
              }}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors ${lengthOption === '60' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}
            >
              60 cm Zincir
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-extrabold text-slate-900 mb-1 uppercase tracking-wider">Altın Kuru</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={goldPriceInput !== '' ? goldPriceInput : goldInfo.goldPrice.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              onChange={(e) => {
                const inputValue = e.target.value
                // Nokta ve virgülleri temizle (sadece rakamlar)
                const cleanedValue = inputValue.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
                
                // Sadece geçerli sayı formatını kabul et
                if (inputValue === '' || /^(\d+)([.,]\d{0,2})?$/.test(inputValue.replace(/\./g, ''))) {
                  setGoldPriceInput(inputValue)
                  
                  const numValue = parseFloat(cleanedValue)
                  if (!isNaN(numValue) && numValue >= 0) {
                    updateGoldInfo('goldPrice', numValue)
                  } else if (inputValue === '') {
                    updateGoldInfo('goldPrice', 0)
                  }
                }
              }}
              onBlur={() => {
                // Focus kaybolduğunda input state'ini temizle, değer goldInfo'dan formatlı gösterilecek
                setGoldPriceInput('')
              }}
              className="w-full px-2.5 py-2 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white transition-all font-medium text-slate-900 hover:border-slate-400 shadow-sm"
              placeholder="0,00"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">TL</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="border border-slate-300/70 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 ring-1 ring-slate-200/30">
          <button
            onClick={() => toggleSection('labor')}
            className="w-full px-2.5 py-2 flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white hover:from-slate-100/50 hover:to-white transition-all duration-200 group"
          >
            <span className="font-bold text-slate-900 text-sm">İşçilik</span>
            <Plus className={`w-4 h-4 text-gray-700 transition-transform ${expandedSections.labor ? 'rotate-45' : ''}`} />
          </button>
          {expandedSections.labor && (
            <div className="p-2.5 bg-white border-t border-slate-200/80 space-y-2">
          <div>
                <label className="block text-xs text-gray-700 mb-1 font-medium">İşçilik (milyem)</label>
                <input
                  type="number"
                  step="0.001"
                  value={productInfo.laborMillem}
                  onChange={(e) => updateProductInfo('laborMillem', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                  placeholder="0.050"
                />
                <div className="mt-1 text-xs text-gray-500 font-light">
                  Gram başına işçilik oranı
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-slate-300/70 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 ring-1 ring-slate-200/30">
          <button
            onClick={() => toggleSection('extras')}
            className="w-full px-2.5 py-2 flex items-center justify-between bg-white/90 hover:bg-white transition-all duration-200 group"
          >
            <span className="font-bold text-slate-900 text-sm">Ekstralar</span>
            <Plus className={`w-4 h-4 text-gray-700 transition-transform ${expandedSections.extras ? 'rotate-45' : ''}`} />
          </button>
          {expandedSections.extras && (
            <div className="p-2.5 space-y-2 bg-white border-t border-slate-200/80">
              <div className="flex items-center justify-between p-2 bg-slate-50/80 rounded-lg border border-slate-200/60 shadow-sm">
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900 mb-0.5">Ekstra Maliyet Farkı</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={expenses.specialPackaging}
                    onChange={(e) => updateExpenses('specialPackaging', parseFloat(e.target.value) || 0)}
                    disabled={expenses.specialPackaging === 0}
                    className="w-20 px-2 py-1 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="150"
                  />
                  <span className="text-xs text-gray-500">TL</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expenses.specialPackaging > 0}
                      onChange={handleSpecialPackagingToggle}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
          </div>
          </div>
          </div>
          )}
        </div>
      </div>

      <div className="border border-slate-300/60 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50/80 to-white backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
        <button
          onClick={() => toggleSection('expenses')}
          className="w-full px-2.5 py-2 flex items-center justify-between bg-white/90 hover:bg-white transition-all duration-200 group"
        >
          <span className="font-bold text-slate-900 text-sm">Masraf Kalemleri</span>
          <Plus className={`w-5 h-5 text-gray-700 transition-transform ${expandedSections.expenses ? 'rotate-45' : ''}`} />
        </button>
        {expandedSections.expenses && (
          <div className="p-2.5 bg-white border-t border-slate-200/80">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Kargo</label>
                <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={expenses.shipping}
                  onChange={(e) => updateExpenses('shipping', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-center shadow-sm"
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
                    className="w-full px-2 py-2 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-center shadow-sm"
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
                    className="w-full px-2 py-2 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-center shadow-sm"
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
                  className="w-full px-2 py-2 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-center shadow-sm"
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
          <button
            onClick={addPlatform}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
            title="Yeni senaryo ekle"
          >
            <Plus className="w-3 h-3" />
            Senaryo Ekle
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
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
                  className="w-full px-2 py-1.5 pr-8 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-slate-900 text-center shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500"
                  placeholder="Senaryo adı"
                />
                {platforms.length > 1 && platform.name !== 'Standart' && (
                  <button
                    onClick={() => removePlatform(index)}
                    className="absolute top-1/2 right-1.5 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 shadow-sm hover:shadow-md group z-10"
                    title="Senaryoyu sil"
                  >
                    <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" strokeWidth={3} />
                  </button>
                )}
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
                      className="w-full px-2 py-1.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-center font-semibold shadow-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">Kâr Oranı (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(platform.targetProfitRate ?? (platform.name === 'Astarlı Ürün' ? 30 : 15)) === 0 ? '' : (platform.targetProfitRate ?? (platform.name === 'Astarlı Ürün' ? 30 : 15))}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                        updatePlatform(index, 'targetProfitRate', value)
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-slate-300/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-center font-semibold shadow-sm"
                      placeholder={platform.name === 'Astarlı Ürün' ? '30' : '15'}
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
                  <input
                    type="number"
                  step="1"
                    value={platform.salePrice}
                  onChange={(e) => {
                    // Sabit kartların satış fiyatı manuel değiştirilemez (otomatik hesaplanır)
                    if (platform.name === 'Standart' || platform.name === 'Astarlı Ürün') return
                    updatePlatform(index, 'salePrice', parseInt(e.target.value) || 0)
                  }}
                  disabled={platform.name === 'Standart' || platform.name === 'Astarlı Ürün'}
                  className="w-full px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-center font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                  placeholder="0"
                  />
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
