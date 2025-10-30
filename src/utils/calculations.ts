import { ProductInfo, GoldInfo, Expenses, Platform, ProfitResult } from '../types'

// 14 ayar milyem sabit değeri
const AYAR_14_MILLEM = 0.585

// Has Gram hesaplama: (İşçilik milyemi + Lazer Kesim milyemi + 14 ayar milyem) × Ürün Gramı
export function calculatePureGoldGram(productInfo: ProductInfo): number {
  const totalLaborMillem = productInfo.laborMillem + (productInfo.laserCuttingEnabled ? productInfo.laserCuttingMillem : 0)
  return (totalLaborMillem + AYAR_14_MILLEM) * productInfo.productGram
}

// Ürün Tutarı hesaplama: Has Gram × Altın Kuru
export function calculateProductAmount(pureGoldGram: number, goldPrice: number): number {
  return pureGoldGram * goldPrice
}

// Alış Fiyatı hesaplama: Ürün Tutarı (işçilik maliyeti ayrı bir gider olarak sayılmıyor, Has Gram'da dahil)
// Görseldeki mantığa göre: Alış Fiyatı = Ürün Tutarı (işçilik dahil Has Gram üzerinden hesaplanıyor)
export function calculatePurchasePrice(
  productAmount: number,
  productGram: number,
  laborMillem: number,
  goldPrice: number
): number {
  // Görseldeki mantığa göre: Ürün Tutarı zaten Has Gram × Altın Kuru olarak hesaplanıyor
  // Has Gram'da işçilik milyemi dahil, dolayısıyla işçilik maliyeti eklenmiyor
  return productAmount
}

export function calculateProfit(
  productInfo: ProductInfo,
  goldInfo: GoldInfo,
  expenses: Expenses,
  platform: Platform
): ProfitResult {
  // Has Gram hesapla
  const pureGoldGram = calculatePureGoldGram(productInfo)
  
  // Ürün Tutarı hesapla
  const productAmount = calculateProductAmount(pureGoldGram, goldInfo.goldPrice)
  
  // Toplam işçilik milyemi (normal + lazer kesim)
  const totalLaborMillem = productInfo.laborMillem + (productInfo.laserCuttingEnabled ? productInfo.laserCuttingMillem : 0)
  
  // Alış Fiyatı hesapla
  const purchasePrice = calculatePurchasePrice(
    productAmount,
    productInfo.productGram,
    totalLaborMillem,
    goldInfo.goldPrice
  )
  
  // Komisyon Tutarı: Satış Tutarı × Komisyon Oranı / 100
  const commissionAmount = (platform.salePrice * platform.commissionRate) / 100
  
  // E-ticaret Stopajı: Satış Tutarı × (eCommerceTaxRate / 100) (her senaryo için farklı)
  const eCommerceTaxRate = expenses.eCommerceTaxRate || 1.00
  const eCommerceTaxAmount = platform.salePrice * (eCommerceTaxRate / 100)
  
  // Masraf Toplamı: Kargo + Ambalaj + Stopaj + Hizmet + Ekstra Zincir + Işıklı Kutu
  const totalExpenses = 
    expenses.shipping +
    expenses.packaging +
    eCommerceTaxAmount + // Stopaj satış tutarına göre hesaplanıyor
    expenses.serviceFee +
    expenses.extraChain +
    expenses.specialPackaging
  
  // Toplam Maliyet: Alış Fiyatı + Masraf Toplamı + Komisyon Tutarı
  const totalCost = purchasePrice + totalExpenses + commissionAmount
  
  // Kazanç: Satış Tutarı - Toplam Maliyet
  const netProfit = platform.salePrice - totalCost
  
  // Kâr %: (Kazanç ÷ Satış Tutarı) × 100
  const profitRate = (netProfit / platform.salePrice) * 100

  // Bankaya yatan: Satış Tutarı - (Komisyon + Kargo + Stopaj)
  const bankayaYatan = platform.salePrice - (commissionAmount + expenses.shipping + eCommerceTaxAmount)

  return {
    platform: platform.name,
    commissionRate: platform.commissionRate,
    salePrice: platform.salePrice,
    commissionAmount,
    totalExpenses,
    netProfit,
    profitRate,
    bankayaYatan
  }
}

export function calculateAllPlatforms(
  productInfo: ProductInfo,
  goldInfo: GoldInfo,
  expenses: Expenses,
  platforms: Platform[]
): ProfitResult[] {
  // Özel sıralama: Standart ilk, sonra Senaryo 1, Senaryo 2, vb.
  const sortedPlatforms = [...platforms].sort((a, b) => {
    // Standart her zaman ilk
    if (a.name === 'Standart') return -1
    if (b.name === 'Standart') return 1
    
    // Senaryo numaralarına göre sırala
    const getScenarioNumber = (name: string): number => {
      const match = name.match(/Senaryo (\d+)/)
      return match ? parseInt(match[1]) : Infinity
    }
    
    const numA = getScenarioNumber(a.name)
    const numB = getScenarioNumber(b.name)
    
    if (numA !== Infinity && numB !== Infinity) {
      return numA - numB
    }
    
    // Senaryo olmayan diğer isimler alfabetik sırada
    return a.name.localeCompare(b.name)
  })
  
  return sortedPlatforms.map(platform => 
    calculateProfit(productInfo, goldInfo, expenses, platform)
  )
}

// Standart senaryo için satış fiyatını hesapla (masraflar, komisyon ve kâr dahil)
export function calculateStandardSalePrice(
  productInfo: ProductInfo,
  goldInfo: GoldInfo,
  expenses: Expenses,
  commissionRate: number = 22,
  targetProfitRate: number = 15 // Hedef kâr oranı (%)
): number {
  // Has Gram hesapla
  const pureGoldGram = calculatePureGoldGram(productInfo)
  
  // Ürün Tutarı hesapla
  const productAmount = calculateProductAmount(pureGoldGram, goldInfo.goldPrice)
  
  // Toplam işçilik milyemi (normal + lazer kesim)
  const totalLaborMillem = productInfo.laborMillem + (productInfo.laserCuttingEnabled ? productInfo.laserCuttingMillem : 0)
  
  // Alış Fiyatı hesapla
  const purchasePrice = calculatePurchasePrice(
    productAmount,
    productInfo.productGram,
    totalLaborMillem,
    goldInfo.goldPrice
  )
  
  // Sabit masraflar (stopaj hariç)
  const fixedExpenses = 
    expenses.shipping +
    expenses.packaging +
    expenses.serviceFee +
    expenses.extraChain +
    expenses.specialPackaging
  
  // Stopaj oranı
  const eCommerceTaxRate = expenses.eCommerceTaxRate || 1.00
  
  // Formül: Satış Fiyatı = (Alış Fiyatı + Sabit Masraflar) / (1 - Stopaj Oranı/100 - Komisyon Oranı/100 - Kâr Oranı/100)
  const denominator = 1 - (eCommerceTaxRate / 100) - (commissionRate / 100) - (targetProfitRate / 100)
  
  // Payda sıfır veya negatif olmamalı
  if (denominator <= 0) {
    // Fallback: Eski yöntem (en azından bir değer döndürmek için)
    return productInfo.productGram * goldInfo.goldPrice * 1.2
  }
  
  const calculatedSalePrice = (purchasePrice + fixedExpenses) / denominator
  
  // Alt sınır yok; doğrudan yukarı yuvarla
  return Math.ceil(calculatedSalePrice)
}
